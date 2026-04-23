/**
 * Google Drive service — OAuth 2.0 gated.
 * Requires user to be signed in with Google (drive.file scope).
 */

import { google } from "googleapis";
import { DriveFile, VoterInfo, ApiResult } from "@/types";

export class GoogleDriveService {
  private getAuth(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return auth;
  }

  /**
   * Save personalized voter guide as a Google Doc.
   */
  async saveVoterGuide(
    content: string,
    fileName: string,
    accessToken: string
  ): Promise<ApiResult<DriveFile>> {
    try {
      const auth = this.getAuth(accessToken);
      const drive = google.drive({ version: "v3", auth });

      // Upload as a Google Doc (converts plain text/HTML)
      const response = await drive.files.create({
        requestBody: {
          name: fileName,
          mimeType: "application/vnd.google-apps.document",
        },
        media: {
          mimeType: "text/plain",
          body: content,
        },
        fields: "id,name,mimeType,webViewLink,webContentLink",
      });

      const file = response.data;

      // Make it readable by anyone with the link
      await drive.permissions.create({
        fileId: file.id!,
        requestBody: { role: "reader", type: "anyone" },
      });

      return {
        ok: true,
        data: {
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          webViewLink: file.webViewLink ?? undefined,
          webContentLink: file.webContentLink ?? undefined,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Drive API error: ${msg}`, code: 500 };
    }
  }

  /**
   * Create a shared resource folder with multiple files.
   */
  async createResourceFolder(
    folderName: string,
    accessToken: string
  ): Promise<ApiResult<DriveFile>> {
    try {
      const auth = this.getAuth(accessToken);
      const drive = google.drive({ version: "v3", auth });

      const folder = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: "application/vnd.google-apps.folder",
        },
        fields: "id,name,mimeType,webViewLink",
      });

      await drive.permissions.create({
        fileId: folder.data.id!,
        requestBody: { role: "reader", type: "anyone" },
      });

      return {
        ok: true,
        data: {
          id: folder.data.id!,
          name: folder.data.name!,
          mimeType: folder.data.mimeType!,
          webViewLink: folder.data.webViewLink ?? undefined,
        },
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, error: `Drive folder error: ${msg}`, code: 500 };
    }
  }

  /**
   * Build a voter guide text document from voter info data.
   */
  buildVoterGuideContent(
    address: string,
    voterInfo: VoterInfo,
    userName?: string
  ): string {
    const now = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const lines: string[] = [
      `PERSONALIZED VOTER GUIDE`,
      userName ? `Prepared for: ${userName}` : "",
      `Address: ${address}`,
      `Generated: ${now}`,
      `Source: Election Process Assistant`,
      "",
      "═".repeat(60),
      "",
    ];

    if (voterInfo.election) {
      lines.push(`UPCOMING ELECTION: ${voterInfo.election.name}`);
      lines.push(`Election Day: ${voterInfo.election.electionDay}`);
      lines.push("");
    }

    if (voterInfo.pollingLocations?.length) {
      lines.push("YOUR POLLING PLACE");
      lines.push("─".repeat(40));
      const pl = voterInfo.pollingLocations[0];
      lines.push(`${pl.name}`);
      lines.push(`${pl.address}, ${pl.city}, ${pl.state} ${pl.zip}`);
      if (pl.hours) lines.push(`Hours: ${pl.hours}`);
      lines.push("");
    }

    if (voterInfo.contests?.length) {
      lines.push("YOUR BALLOT");
      lines.push("─".repeat(40));
      for (const contest of voterInfo.contests) {
        lines.push(`\n${contest.office}`);
        if (contest.candidates?.length) {
          for (const c of contest.candidates) {
            lines.push(`  • ${c.name}${c.party ? ` (${c.party})` : ""}`);
            if (c.candidateUrl) lines.push(`    Website: ${c.candidateUrl}`);
          }
        }
        if (contest.referendumTitle) {
          lines.push(`  Measure: ${contest.referendumTitle}`);
          if (contest.referendumSubtitle) lines.push(`  ${contest.referendumSubtitle}`);
        }
      }
      lines.push("");
    }

    lines.push("─".repeat(60));
    lines.push("This guide is for informational purposes only.");
    lines.push("Always verify information with your local elections office.");

    return lines.filter((l) => l !== undefined).join("\n");
  }
}

export const driveService = new GoogleDriveService();
