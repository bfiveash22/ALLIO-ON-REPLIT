#!/usr/bin/env python3
"""
Daily Admin Report Generator for Forgotten Formula Clinical Intelligence Console
Queries PostgreSQL database and generates formatted HTML report
"""
import os
import json
from datetime import datetime
from zoneinfo import ZoneInfo
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment
from dotenv import load_dotenv
load_dotenv('/home/ubuntu/shared/.env')

DATABASE_URL = os.getenv('DATABASE_URL')
TIMEZONE = ZoneInfo('America/Chicago')
OUTPUT_DIR = '/home/ubuntu/shared/admin_reports'

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

def run_query(cursor, query):
    cursor.execute(query)
    return cursor.fetchall()

def generate_report():
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    now = datetime.now(TIMEZONE)
    report_date = now.strftime('%Y-%m-%d')
    
    # New user signups in last 24 hours
    new_users = run_query(cursor, '''
        SELECT COUNT(*) AS count FROM "User" 
        WHERE "createdAt" >= (NOW() - INTERVAL '24 hours')
    ''')[0]['count']
    
    new_user_list = run_query(cursor, '''
        SELECT name, email, "createdAt" FROM "User" 
        WHERE "createdAt" >= (NOW() - INTERVAL '24 hours')
        ORDER BY "createdAt" DESC
    ''')
    
    # Total conversations by type
    peptide_convos = run_query(cursor, 'SELECT COUNT(*) AS count FROM "Conversation"')[0]['count']
    iv_convos = run_query(cursor, 'SELECT COUNT(*) AS count FROM "IVConversation"')[0]['count']
    im_convos = run_query(cursor, 'SELECT COUNT(*) AS count FROM "IMConversation"')[0]['count']
    
    # Message counts by type
    peptide_msgs = run_query(cursor, 'SELECT COUNT(*) AS count FROM "Message"')[0]['count']
    iv_msgs = run_query(cursor, 'SELECT COUNT(*) AS count FROM "IVMessage"')[0]['count']
    im_msgs = run_query(cursor, 'SELECT COUNT(*) AS count FROM "IMMessage"')[0]['count']
    
    # Top 5 most consulted peptides
    top_peptides = run_query(cursor, '''
        SELECT p.name, COUNT(*) AS conversation_count
        FROM "Conversation" c
        JOIN "Peptide" p ON c."peptideId" = p.id
        GROUP BY p.name
        ORDER BY conversation_count DESC
        LIMIT 5
    ''')
    
    # Top 5 most consulted IV therapies
    top_iv = run_query(cursor, '''
        SELECT t.name, COUNT(*) AS conversation_count
        FROM "IVConversation" c
        JOIN "IVTherapy" t ON c."ivTherapyId" = t.id
        GROUP BY t.name
        ORDER BY conversation_count DESC
        LIMIT 5
    ''')
    
    # Top 5 most consulted IM therapies
    top_im = run_query(cursor, '''
        SELECT t.name, COUNT(*) AS conversation_count
        FROM "IMConversation" c
        JOIN "IMTherapy" t ON c."imTherapyId" = t.id
        GROUP BY t.name
        ORDER BY conversation_count DESC
        LIMIT 5
    ''')
    
    # Active users last 7 days
    active_users = run_query(cursor, '''
        SELECT COUNT(DISTINCT user_id) AS count
        FROM (
            SELECT c."userId" AS user_id FROM "Conversation" c
            JOIN "Message" m ON m."conversationId" = c.id
            WHERE m."createdAt" >= (NOW() - INTERVAL '7 days')
            UNION
            SELECT c."userId" AS user_id FROM "IVConversation" c
            JOIN "IVMessage" m ON m."ivConversationId" = c.id
            WHERE m."createdAt" >= (NOW() - INTERVAL '7 days')
            UNION
            SELECT c."userId" AS user_id FROM "IMConversation" c
            JOIN "IMMessage" m ON m."imConversationId" = c.id
            WHERE m."createdAt" >= (NOW() - INTERVAL '7 days')
        ) AS users
    ''')[0]['count']
    
    # Total users
    total_users = run_query(cursor, 'SELECT COUNT(*) AS count FROM "User"')[0]['count']
    
    cursor.close()
    conn.close()
    
    # Calculate averages
    total_convos = peptide_convos + iv_convos + im_convos
    total_msgs = peptide_msgs + iv_msgs + im_msgs
    avg_msgs = round(total_msgs / total_convos, 1) if total_convos > 0 else 0
    
    # Generate HTML
    html = f'''<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #1a1a2e; color: #e0e0e0; padding: 20px; }}
        .container {{ max-width: 700px; margin: 0 auto; }}
        h1 {{ color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px; }}
        h2 {{ color: #a855f7; margin-top: 25px; }}
        .metric-box {{ background: #252542; border-radius: 10px; padding: 15px; margin: 10px 0; }}
        .metric-value {{ font-size: 28px; font-weight: bold; color: #00d4ff; }}
        .metric-label {{ color: #94a3b8; }}
        table {{ width: 100%; border-collapse: collapse; margin: 10px 0; }}
        th {{ background: #374151; color: #00d4ff; padding: 10px; text-align: left; }}
        td {{ padding: 10px; border-bottom: 1px solid #374151; }}
        tr:nth-child(even) {{ background: #1e1e32; }}
        .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }}
        .timestamp {{ color: #64748b; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🧬 Forgotten Formula Clinical Intelligence</h1>
        <h2 style="color: #00d4ff; margin-top: 0;">Daily Admin Report</h2>
        <p class="timestamp">Generated: {now.strftime('%B %d, %Y at %I:%M %p CST')}</p>
        
        <h2>📊 Overview Metrics</h2>
        <div class="grid">
            <div class="metric-box">
                <div class="metric-value">{total_users}</div>
                <div class="metric-label">Total Users</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">{new_users}</div>
                <div class="metric-label">New Users (24h)</div>
            </div>
            <div class="metric-box">
                <div class="metric-value">{active_users}</div>
                <div class="metric-label">Active Users (7d)</div>
            </div>
        </div>
        
        <h2>💬 Conversation Breakdown</h2>
        <table>
            <tr><th>Type</th><th>Conversations</th><th>Messages</th></tr>
            <tr><td>🧬 Peptide</td><td>{peptide_convos}</td><td>{peptide_msgs}</td></tr>
            <tr><td>💉 IV Therapy</td><td>{iv_convos}</td><td>{iv_msgs}</td></tr>
            <tr><td>💊 IM Therapy</td><td>{im_convos}</td><td>{im_msgs}</td></tr>
            <tr style="background: #374151; font-weight: bold;">
                <td>Total</td><td>{total_convos}</td><td>{total_msgs}</td>
            </tr>
        </table>
        <p><strong>Avg Messages/Conversation:</strong> {avg_msgs}</p>
        
        <h2>🏆 Top 5 Consulted Peptides</h2>
        <table>
            <tr><th>#</th><th>Peptide</th><th>Consultations</th></tr>
            {''.join(f'<tr><td>{i+1}</td><td>{p["name"]}</td><td>{p["conversation_count"]}</td></tr>' for i, p in enumerate(top_peptides)) or '<tr><td colspan="3">No data</td></tr>'}
        </table>
        
        <h2>💧 Top 5 Consulted IV Therapies</h2>
        <table>
            <tr><th>#</th><th>IV Therapy</th><th>Consultations</th></tr>
            {''.join(f'<tr><td>{i+1}</td><td>{t["name"]}</td><td>{t["conversation_count"]}</td></tr>' for i, t in enumerate(top_iv)) or '<tr><td colspan="3">No data</td></tr>'}
        </table>
        
        <h2>💊 Top 5 Consulted IM Therapies</h2>
        <table>
            <tr><th>#</th><th>IM Therapy</th><th>Consultations</th></tr>
            {''.join(f'<tr><td>{i+1}</td><td>{t["name"]}</td><td>{t["conversation_count"]}</td></tr>' for i, t in enumerate(top_im)) or '<tr><td colspan="3">No data</td></tr>'}
        </table>
        
        {'<h2>👤 New User Signups (Last 24h)</h2><table><tr><th>Name</th><th>Email</th></tr>' + ''.join(f'<tr><td>{u["name"]}</td><td>{u["email"]}</td></tr>' for u in new_user_list) + '</table>' if new_user_list else ''}
        
        <p style="margin-top: 30px; color: #64748b; font-size: 12px;">
            This report is automatically generated by the FF Clinical Intelligence Console.
        </p>
    </div>
</body>
</html>'''
    
    # Save report
    output_path = f'{OUTPUT_DIR}/daily_admin_report_{report_date}.html'
    with open(output_path, 'w') as f:
        f.write(html)
    
    print(f"Report generated: {output_path}")
    return output_path, html

if __name__ == '__main__':
    generate_report()
