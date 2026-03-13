#!/usr/bin/env python3
"""
Weekly Database Analytics Report for Forgotten Formula Clinical Intelligence Console
Generates usage analytics, top therapies, and inactive user reports
"""
import os
import csv
from datetime import datetime
from zoneinfo import ZoneInfo
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv('/home/ubuntu/shared/.env')

DATABASE_URL = os.getenv('DATABASE_URL')
TIMEZONE = ZoneInfo('America/Chicago')
OUTPUT_DIR = '/home/ubuntu/shared/admin_reports/weekly'

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def run_query(cursor, query):
    cursor.execute(query)
    return cursor.fetchall()

def generate_report():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    now = datetime.now(TIMEZONE)
    report_date = now.strftime('%Y-%m-%d')
    
    # Top 10 peptides by conversation count
    top_peptides = run_query(cursor, '''
        SELECT p.name, p.era, COUNT(c.id) AS conversation_count
        FROM "Peptide" p
        LEFT JOIN "Conversation" c ON c."peptideId" = p.id
        GROUP BY p.id, p.name, p.era
        ORDER BY conversation_count DESC
        LIMIT 10
    ''')
    
    # Top 10 IV therapies by conversation count
    top_iv = run_query(cursor, '''
        SELECT iv.name, iv.category, COUNT(ivc.id) AS conversation_count
        FROM "IVTherapy" iv
        LEFT JOIN "IVConversation" ivc ON ivc."ivTherapyId" = iv.id
        GROUP BY iv.id, iv.name, iv.category
        ORDER BY conversation_count DESC
        LIMIT 10
    ''')
    
    # Top 10 IM therapies by conversation count
    top_im = run_query(cursor, '''
        SELECT im.name, im.category, COUNT(imc.id) AS conversation_count
        FROM "IMTherapy" im
        LEFT JOIN "IMConversation" imc ON imc."imTherapyId" = im.id
        GROUP BY im.id, im.name, im.category
        ORDER BY conversation_count DESC
        LIMIT 10
    ''')
    
    # Conversations by peptide era/category
    peptide_by_era = run_query(cursor, '''
        SELECT p.era AS category, COUNT(c.id) AS conversation_count
        FROM "Peptide" p
        LEFT JOIN "Conversation" c ON c."peptideId" = p.id
        GROUP BY p.era
        ORDER BY conversation_count DESC
    ''')
    
    # Conversations by IV category
    iv_by_cat = run_query(cursor, '''
        SELECT iv.category, COUNT(ivc.id) AS conversation_count
        FROM "IVTherapy" iv
        LEFT JOIN "IVConversation" ivc ON ivc."ivTherapyId" = iv.id
        GROUP BY iv.category
        ORDER BY conversation_count DESC
    ''')
    
    # Conversations by IM category
    im_by_cat = run_query(cursor, '''
        SELECT im.category, COUNT(imc.id) AS conversation_count
        FROM "IMTherapy" im
        LEFT JOIN "IMConversation" imc ON imc."imTherapyId" = im.id
        GROUP BY im.category
        ORDER BY conversation_count DESC
    ''')
    
    # Inactive users (no activity in 30+ days)
    inactive_users = run_query(cursor, '''
        WITH user_activity AS (
            SELECT u.id, u.email, u.name, u."createdAt",
                   MAX(a.last_activity) AS last_activity
            FROM "User" u
            LEFT JOIN (
                SELECT "userId" AS user_id, "updatedAt" AS last_activity FROM "Conversation"
                UNION ALL
                SELECT "userId" AS user_id, "updatedAt" AS last_activity FROM "IVConversation"
                UNION ALL
                SELECT "userId" AS user_id, "updatedAt" AS last_activity FROM "IMConversation"
            ) a ON a.user_id = u.id
            GROUP BY u.id, u.email, u.name, u."createdAt"
        )
        SELECT id, email, name, "createdAt", last_activity
        FROM user_activity
        WHERE last_activity IS NULL
           OR last_activity < (NOW() - INTERVAL '30 days')
        ORDER BY last_activity NULLS FIRST
    ''')
    
    # Summary metrics
    total_users = run_query(cursor, 'SELECT COUNT(*) AS count FROM "User"')[0]['count']
    active_30d = run_query(cursor, '''
        SELECT COUNT(DISTINCT user_id) AS count FROM (
            SELECT "userId" AS user_id FROM "Conversation" WHERE "updatedAt" >= NOW() - INTERVAL '30 days'
            UNION
            SELECT "userId" AS user_id FROM "IVConversation" WHERE "updatedAt" >= NOW() - INTERVAL '30 days'
            UNION
            SELECT "userId" AS user_id FROM "IMConversation" WHERE "updatedAt" >= NOW() - INTERVAL '30 days'
        ) t
    ''')[0]['count']
    
    total_peptides = run_query(cursor, 'SELECT COUNT(*) AS count FROM "Peptide"')[0]['count']
    total_iv = run_query(cursor, 'SELECT COUNT(*) AS count FROM "IVTherapy"')[0]['count']
    total_im = run_query(cursor, 'SELECT COUNT(*) AS count FROM "IMTherapy"')[0]['count']
    
    total_convos = run_query(cursor, '''
        SELECT (SELECT COUNT(*) FROM "Conversation") +
               (SELECT COUNT(*) FROM "IVConversation") +
               (SELECT COUNT(*) FROM "IMConversation") AS total
    ''')[0]['total']
    
    cursor.close()
    conn.close()
    
    # Generate HTML report
    def generate_inactive_section(users):
        if not users:
            return '<p>All users are active!</p>'
        alert = f'<div class="alert">Found {len(users)} users with no activity in the last 30 days.</div>'
        rows = []
        for u in users[:20]:
            last_act = u["last_activity"].strftime("%Y-%m-%d") if u["last_activity"] else "Never"
            rows.append(f'<tr><td>{u["name"]}</td><td>{u["email"]}</td><td>{last_act}</td></tr>')
        table = f'''<table>
            <tr><th>Name</th><th>Email</th><th>Last Activity</th></tr>
            {"".join(rows)}
        </table>
        <p>Showing top 20 of {len(users)} inactive users</p>'''
        return alert + table
    
    def make_row(r, cols):
        cells = []
        for c in cols:
            key = c.lower().replace(" ", "_")
            val = r.get(key, r.get(c, ""))
            cells.append(f"<td>{val}</td>")
        return "".join(cells)
    
    def make_table(data, cols):
        if not data:
            return '<p>No data available</p>'
        headers = ''.join(f'<th>{c}</th>' for c in cols)
        rows = ''.join(f'<tr>{make_row(r, cols)}</tr>' for r in data)
        return f'<table><tr>{headers}</tr>{rows}</table>'
    
    html = f'''<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e0e0e0; padding: 20px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        h1 {{ color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }}
        h2 {{ color: #6366f1; margin-top: 30px; }}
        h3 {{ color: #a855f7; }}
        .metric-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }}
        .metric-box {{ background: #1e293b; border-radius: 10px; padding: 15px; text-align: center; }}
        .metric-value {{ font-size: 32px; font-weight: bold; color: #10b981; }}
        .metric-label {{ color: #94a3b8; font-size: 14px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
        th {{ background: #334155; color: #10b981; padding: 12px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #334155; }}
        tr:nth-child(even) {{ background: #1e293b; }}
        .alert {{ background: #7c2d12; border-left: 4px solid #f97316; padding: 15px; margin: 20px 0; }}
        .timestamp {{ color: #64748b; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Weekly Database Analytics</h1>
        <p class="timestamp">Report Period: Week ending {now.strftime('%B %d, %Y')}</p>
        
        <h2>📈 Platform Overview</h2>
        <div class="metric-grid">
            <div class="metric-box">
                <div class="metric-value">{total_users}</div>
                <div class="metric-label">Total Users</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">{active_30d}</div>
                <div class="metric-label">Active (30d)</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">{len(inactive_users)}</div>
                <div class="metric-label">Inactive Users</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">{total_convos}</div>
                <div class="metric-label">Total Conversations</div>
            </div>
        </div>
        
        <div class="metric-grid">
            <div class="metric-box">
                <div class="metric-value" style="color: #06b6d4;">{total_peptides}</div>
                <div class="metric-label">Peptides</div>
            </div>
            <div class="metric-box">
                <div class="metric-value" style="color: #6366f1;">{total_iv}</div>
                <div class="metric-label">IV Therapies</div>
            </div>
            <div class="metric-box">
                <div class="metric-value" style="color: #ec4899;">{total_im}</div>
                <div class="metric-label">IM Therapies</div>
            </div>
        </div>
        
        <h2>🧬 Top 10 Peptides by Usage</h2>
        <table>
            <tr><th>#</th><th>Peptide</th><th>Era</th><th>Conversations</th></tr>
            {''.join(f'<tr><td>{i+1}</td><td>{p["name"]}</td><td>{p["era"] or "—"}</td><td>{p["conversation_count"]}</td></tr>' for i, p in enumerate(top_peptides))}
        </table>
        
        <h2>💧 Top 10 IV Therapies by Usage</h2>
        <table>
            <tr><th>#</th><th>IV Therapy</th><th>Category</th><th>Conversations</th></tr>
            {''.join(f'<tr><td>{i+1}</td><td>{t["name"]}</td><td>{t["category"] or "—"}</td><td>{t["conversation_count"]}</td></tr>' for i, t in enumerate(top_iv))}
        </table>
        
        <h2>💊 Top 10 IM Therapies by Usage</h2>
        <table>
            <tr><th>#</th><th>IM Therapy</th><th>Category</th><th>Conversations</th></tr>
            {''.join(f'<tr><td>{i+1}</td><td>{t["name"]}</td><td>{t["category"] or "—"}</td><td>{t["conversation_count"]}</td></tr>' for i, t in enumerate(top_im))}
        </table>
        
        <h2>📂 Conversations by Category</h2>
        
        <h3>Peptide Eras</h3>
        <table>
            <tr><th>Era/Category</th><th>Conversations</th></tr>
            {''.join(f'<tr><td>{c["category"] or "Uncategorized"}</td><td>{c["conversation_count"]}</td></tr>' for c in peptide_by_era)}
        </table>
        
        <h3>IV Therapy Categories</h3>
        <table>
            <tr><th>Category</th><th>Conversations</th></tr>
            {''.join(f'<tr><td>{c["category"] or "Uncategorized"}</td><td>{c["conversation_count"]}</td></tr>' for c in iv_by_cat)}
        </table>
        
        <h3>IM Therapy Categories</h3>
        <table>
            <tr><th>Category</th><th>Conversations</th></tr>
            {''.join(f'<tr><td>{c["category"] or "Uncategorized"}</td><td>{c["conversation_count"]}</td></tr>' for c in im_by_cat)}
        </table>
        
        <h2>⚠️ Inactive Users (30+ Days)</h2>
        {generate_inactive_section(inactive_users)}
        
        <p style="margin-top: 40px; color: #64748b; font-size: 12px;">
            This weekly analytics report is automatically generated by the FF Clinical Intelligence Console.
        </p>
    </div>
</body>
</html>'''
    
    output_path = f'{OUTPUT_DIR}/weekly_analytics_{report_date}.html'
    with open(output_path, 'w') as f:
        f.write(html)
    
    print(f"Weekly analytics report generated: {output_path}")
    return output_path, html

if __name__ == '__main__':
    generate_report()
