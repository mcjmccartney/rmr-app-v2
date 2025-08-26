import { SessionPlan, ActionPoint, Session, Client } from '@/types';
import { personalizeActionPoint } from '@/data/actionPoints';

// For PDF generation - we'll use jsPDF
declare global {
  interface Window {
    jsPDF: any;
  }
}

interface EditableContent {
  title: string;
  sessionNumber: number;
  dogName: string;
  ownerName: string;
  sessionDate: string;
  sessionTime: string;
  sessionType: string;
  mainGoals: string[];
  explanationOfBehaviour: string;
  actionPoints: { header: string; details: string }[];
}

// Google Docs API configuration (for future use)
// const GOOGLE_DOCS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_DOCS_API_KEY;
// const GOOGLE_DOCS_TEMPLATE_ID = process.env.NEXT_PUBLIC_GOOGLE_DOCS_TEMPLATE_ID;

interface SessionPlanDocumentData {
  sessionPlan: SessionPlan;
  session: Session;
  client: Client;
  actionPoints: ActionPoint[];
}

export const googleDocsService = {
  // Generate PDF from edited content
  async generatePDFFromContent(content: EditableContent): Promise<void> {
    // Load jsPDF dynamically
    if (!window.jsPDF) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      document.head.appendChild(script);

      await new Promise((resolve) => {
        script.onload = resolve;
      });
    }

    const { jsPDF } = window;
    const doc = new jsPDF();

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Helper function to add text with word wrapping
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      if (isBold) {
        doc.setFont(undefined, 'bold');
      } else {
        doc.setFont(undefined, 'normal');
      }

      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * (fontSize * 0.4) + 5;

      // Check if we need a new page
      if (yPosition > doc.internal.pageSize.height - 30) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Title
    addText(content.title, 18, true);
    yPosition += 10;

    // Session Information
    addText('Session Information', 14, true);
    addText(`Dog Name: ${content.dogName}`);
    addText(`Session Number: ${content.sessionNumber}`);
    addText(`Owner: ${content.ownerName}`);
    addText(`Session Type: ${content.sessionType}`);
    addText(`Date: ${new Date(content.sessionDate).toLocaleDateString('en-GB')}`);
    addText(`Time: ${content.sessionTime}`);
    yPosition += 10;

    // Main Goals
    if (content.mainGoals.length > 0) {
      addText('Main Goals', 14, true);
      content.mainGoals.forEach((goal, index) => {
        addText(`Main Goal ${index + 1}: ${goal}`);
      });
      yPosition += 10;
    }

    // Explanation of Behaviour
    if (content.explanationOfBehaviour) {
      addText('Explanation of Behaviour', 14, true);
      addText(content.explanationOfBehaviour);
      yPosition += 10;
    }

    // Action Points
    if (content.actionPoints.length > 0) {
      addText('Action Points', 14, true);
      content.actionPoints.forEach((actionPoint, index) => {
        addText(`Action Point ${index + 1}: ${actionPoint.header}`, 12, true);
        addText(actionPoint.details);
        yPosition += 5;
      });
    }

    // Footer
    yPosition += 20;
    addText(`Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 10);

    // Save the PDF
    doc.save(`Session_Plan_${content.dogName}_Session_${content.sessionNumber}.pdf`);
  },

  // Generate a Google Doc from a session plan (legacy method)
  async generateSessionPlanDocument(data: SessionPlanDocumentData): Promise<string> {
    const { sessionPlan, session, client, actionPoints } = data;

    // Create document content
    const documentContent = this.createDocumentContent(sessionPlan, session, client, actionPoints);

    // For now, we'll create a downloadable HTML file
    // Later, this can be enhanced to use Google Docs API
    const htmlContent = this.createHTMLDocument(documentContent);

    // Create and download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = `Session_Plan_${client.dogName || 'Unknown'}_Session_${sessionPlan.sessionNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    return url;
  },

  // Create the document content structure
  createDocumentContent(sessionPlan: SessionPlan, session: Session, client: Client, actionPoints: ActionPoint[], behaviourQuestionnaires: any[] = []) {
    // Get session-specific dog name (session.dogName takes priority over client.dogName)
    const dogName = session.dogName || client.dogName || 'Unknown Dog';

    // Get dog's gender from questionnaire using comprehensive matching
    const getDogGender = (): 'Male' | 'Female' => {
      if (!client || !dogName) return 'Male';

      // Comprehensive questionnaire matching function
      const findQuestionnaireForClient = (client: any, dogName: string, questionnaires: any[]) => {
        if (!client || !dogName) return null;

        // Method 1: Match by client_id and dog name (case-insensitive)
        let questionnaire = questionnaires.find(q =>
          (q.client_id === client.id || q.clientId === client.id) &&
          q.dogName?.toLowerCase() === dogName.toLowerCase()
        );
        if (questionnaire) return questionnaire;

        // Method 2: Match by email and dog name (case-insensitive)
        if (client.email) {
          questionnaire = questionnaires.find(q =>
            q.email?.toLowerCase() === client.email?.toLowerCase() &&
            q.dogName?.toLowerCase() === dogName.toLowerCase()
          );
          if (questionnaire) return questionnaire;
        }

        // Method 3: Match by partial dog name (case-insensitive)
        questionnaire = questionnaires.find(q =>
          (q.client_id === client.id || q.clientId === client.id) &&
          (q.dogName?.toLowerCase().includes(dogName.toLowerCase()) ||
           dogName.toLowerCase().includes(q.dogName?.toLowerCase() || ''))
        );
        if (questionnaire) return questionnaire;

        // Method 4: Match by email and partial dog name (case-insensitive)
        if (client.email) {
          questionnaire = questionnaires.find(q =>
            q.email?.toLowerCase() === client.email?.toLowerCase() &&
            (q.dogName?.toLowerCase().includes(dogName.toLowerCase()) ||
             dogName.toLowerCase().includes(q.dogName?.toLowerCase() || ''))
          );
        }

        return questionnaire || null;
      };

      const questionnaire = findQuestionnaireForClient(client, dogName, behaviourQuestionnaires);
      return questionnaire?.sex || 'Male';
    };

    const dogGender = getDogGender();
    const sessionNumber = sessionPlan.sessionNumber;
    const ownerName = `${client.firstName} ${client.lastName}`;

    // Get selected action points
    const selectedActionPoints = actionPoints.filter(ap => 
      sessionPlan.actionPoints.includes(ap.id)
    ).map(ap => personalizeActionPoint(ap, dogName, dogGender));

    return {
      title: `Session ${sessionNumber} - ${dogName}`,
      sessionNumber,
      dogName,
      ownerName,
      sessionDate: session.bookingDate,
      sessionTime: session.bookingTime,
      sessionType: session.sessionType,
      mainGoals: [
        sessionPlan.mainGoal1,
        sessionPlan.mainGoal2,
        sessionPlan.mainGoal3,
        sessionPlan.mainGoal4,
      ].filter(Boolean),
      explanationOfBehaviour: sessionPlan.explanationOfBehaviour,
      actionPoints: selectedActionPoints,
    };
  },

  // Create HTML document for download
  createHTMLDocument(content: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${content.title}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #4f6749;
            color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .session-info {
            background-color: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .session-info h2 {
            color: #4f6749;
            margin-top: 0;
            border-bottom: 2px solid #4f6749;
            padding-bottom: 5px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 15px;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
        }
        .info-label {
            font-weight: bold;
            color: #666;
        }
        .section {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #4f6749;
            margin-top: 0;
            border-bottom: 2px solid #4f6749;
            padding-bottom: 5px;
        }
        .goals-list {
            list-style: none;
            padding: 0;
        }
        .goals-list li {
            background-color: #ebeadf;
            padding: 10px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid #4f6749;
        }
        .action-point {
            background-color: #ebeadf;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid #4f6749;
        }
        .action-point h3 {
            color: #4f6749;
            margin-top: 0;
            margin-bottom: 10px;
        }
        .explanation {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #4f6749;
            font-style: italic;
        }
        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .section, .session-info {
                box-shadow: none;
                border: 1px solid #ddd;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${content.title}</h1>
    </div>

    <div class="session-info">
        <h2>Session Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <span class="info-label">Dog Name:</span>
                <span>${content.dogName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Session Number:</span>
                <span>${content.sessionNumber}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Owner:</span>
                <span>${content.ownerName}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Session Type:</span>
                <span>${content.sessionType}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Date:</span>
                <span>${new Date(content.sessionDate).toLocaleDateString('en-GB')}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Time:</span>
                <span>${content.sessionTime}</span>
            </div>
        </div>
    </div>

    ${content.mainGoals.length > 0 ? `
    <div class="section">
        <h2>Main Goals</h2>
        <ul class="goals-list">
            ${content.mainGoals.map((goal: string, index: number) => `
                <li><strong>Main Goal ${index + 1}:</strong> ${goal}</li>
            `).join('')}
        </ul>
    </div>
    ` : ''}

    ${content.explanationOfBehaviour ? `
    <div class="section">
        <h2>Explanation of Behaviour</h2>
        <div class="explanation">
            ${content.explanationOfBehaviour.replace(/\n/g, '<br>')}
        </div>
    </div>
    ` : ''}

    ${content.actionPoints.length > 0 ? `
    <div class="section">
        <h2>Action Points</h2>
        ${content.actionPoints.map((actionPoint: any, index: number) => `
            <div class="action-point">
                <h3>Action Point ${index + 1}: ${actionPoint.header}</h3>
                <p>${actionPoint.details.replace(/\n/g, '<br>')}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 40px; color: #666; font-size: 12px;">
        Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}
    </div>
</body>
</html>`;
  },

  // Future: Integrate with actual Google Docs API
  async createGoogleDoc(_content: any): Promise<string> {
    // This would use the Google Docs API to create a real Google Doc
    // For now, we'll return a placeholder
    throw new Error('Google Docs API integration not yet implemented. Using HTML export instead.');
  }
};
