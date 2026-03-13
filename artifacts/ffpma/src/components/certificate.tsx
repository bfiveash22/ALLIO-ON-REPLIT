import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Download, Share2 } from "lucide-react";

interface CertificateProps {
  type: "module" | "program";
  title: string;
  completedAt: Date;
  userName: string;
  duration?: string;
  id?: string;
}

export function Certificate({ type, title, completedAt, userName, duration, id }: CertificateProps) {
  const certificateRef = useRef<HTMLDivElement>(null);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(completedAt));

  const handleDownload = () => {
    const printContent = certificateRef.current;
    if (printContent) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Certificate of Completion</title>
            <style>
              body { font-family: Georgia, serif; margin: 0; padding: 40px; background: #fff; }
              .certificate { border: 8px double #1e3a5f; padding: 60px; text-align: center; max-width: 800px; margin: 0 auto; }
              .header { font-size: 14px; color: #666; letter-spacing: 4px; margin-bottom: 20px; }
              .title { font-size: 42px; color: #1e3a5f; margin-bottom: 30px; font-weight: normal; }
              .recipient { font-size: 28px; color: #333; margin: 30px 0; border-bottom: 2px solid #1e3a5f; display: inline-block; padding-bottom: 10px; }
              .description { font-size: 16px; color: #666; margin: 20px 0; line-height: 1.6; }
              .course { font-size: 24px; color: #1e3a5f; font-weight: bold; margin: 20px 0; }
              .date { font-size: 14px; color: #666; margin-top: 40px; }
              .seal { margin-top: 40px; }
              .org { font-size: 18px; color: #1e3a5f; margin-top: 20px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="certificate">
              <div class="header">FORGOTTEN FORMULA PMA</div>
              <div class="title">Certificate of Completion</div>
              <div class="description">This is to certify that</div>
              <div class="recipient">${userName}</div>
              <div class="description">has successfully completed the ${type}</div>
              <div class="course">${title}</div>
              ${duration ? `<div class="description">Duration: ${duration}</div>` : ""}
              <div class="date">Completed on ${formattedDate}</div>
              <div class="seal">🏆</div>
              <div class="org">Forgotten Formula Private Member Association</div>
            </div>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <Card 
      ref={certificateRef}
      className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background" 
      data-testid={`certificate-${type}-${id || "default"}`}
    >
      <CardContent className="p-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Award className="h-8 w-8 text-primary" />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground uppercase tracking-widest mb-2">
          Forgotten Formula PMA
        </p>
        
        <h2 className="text-2xl font-serif mb-4" data-testid="text-certificate-title">
          Certificate of Completion
        </h2>
        
        <p className="text-muted-foreground mb-2">This certifies that</p>
        
        <p className="text-xl font-semibold mb-4 pb-2 border-b border-primary/30 inline-block" data-testid="text-certificate-user">
          {userName}
        </p>
        
        <p className="text-muted-foreground mb-2">
          has successfully completed the {type}
        </p>
        
        <h3 className="text-lg font-bold text-primary mb-4" data-testid="text-certificate-course">{title}</h3>
        
        {duration && (
          <p className="text-sm text-muted-foreground mb-4" data-testid="text-certificate-duration">Duration: {duration}</p>
        )}
        
        <p className="text-sm text-muted-foreground mb-6" data-testid="text-certificate-date">
          Completed on {formattedDate}
        </p>
        
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="sm" onClick={handleDownload} data-testid="button-download-certificate">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-share-certificate">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompletionBadge({ type, title }: { type: "module" | "program"; title: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 text-sm">
      <Award className="h-4 w-4" />
      <span>Completed: {title}</span>
    </div>
  );
}
