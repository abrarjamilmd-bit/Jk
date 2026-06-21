var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_fs = __toESM(require("fs"), 1);
import_dotenv.default.config();
var transporter = null;
async function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (user && pass) {
    console.log("Initializing real SMTP transporter using configuration.");
    transporter = import_nodemailer.default.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  } else {
    try {
      console.log("SMTP credentials missing. Attempting to create an Ethereal sandbox SMTP account...");
      const testAccount = await import_nodemailer.default.createTestAccount();
      transporter = import_nodemailer.default.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`Ethereal test SMTP mailbox provisioned: ${testAccount.user}`);
    } catch (err) {
      console.warn("Failed to create Ethereal SMTP workspace, falling back to clean terminal mocks:", err);
      transporter = {
        sendMail: async (options) => {
          console.log("\n==== \u{1F4E7} TO-DO REMINDER NOTIFICATION SENDING MOCK ====");
          console.log(`To: ${options.to}`);
          console.log(`From (Config): ${options.from}`);
          console.log(`Subject: ${options.subject}`);
          console.log("----------------- EMAIL PAYLOAD -----------------");
          console.log(options.html);
          console.log("==================================================\n");
          return { messageId: `mock-id-${Date.now()}`, mock: true };
        }
      };
    }
  }
  return transporter;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/email/send-reminder", async (req, res) => {
    try {
      const { to, task } = req.body;
      if (!to || !task) {
        return res.status(400).json({ error: "\u0985\u09A8\u09C1\u09B0\u09CB\u09A7\u09C7 \u09B8\u09A0\u09BF\u0995 \u0987\u09AE\u09C7\u0987\u09B2 \u09AC\u09BE \u099F\u09BE\u09B8\u09CD\u0995\u09C7\u09B0 \u09A4\u09A5\u09CD\u09AF \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964" });
      }
      const client = await getTransporter();
      const priorityLabel = task.priority === "high" ? "\u{1F6A8} \u0989\u099A\u09CD\u099A" : task.priority === "medium" ? "\u26A1 \u09AE\u09A7\u09CD\u09AF\u09AE" : "\u{1F331} \u09B8\u09BE\u09A7\u09BE\u09B0\u09A3";
      const priorityColor = task.priority === "high" ? "#dc2626" : task.priority === "medium" ? "#d97706" : "#059669";
      const fromName = process.env.SMTP_FROM_NAME || "\u099F\u09BE\u09B8\u09CD\u0995 \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0 \u098F\u099C\u09C7\u09A8\u09CD\u099F";
      const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@ais-todo.com";
      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 25px;">
            <h1 style="color: #10b981; margin: 0; font-size: 24px;">\u{1F4C5} \u099F\u09BE\u09B8\u09CD\u0995 \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0 \u09A8\u09CB\u099F\u09BF\u09AB\u09BF\u0995\u09C7\u09B6\u09A8</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">\u0986\u09AA\u09A8\u09BE\u09B0 \u098F\u0995\u099F\u09BF \u0997\u09C1\u09B0\u09C1\u09A4\u09CD\u09AC\u09AA\u09C2\u09B0\u09CD\u09A3 \u0995\u09BE\u099C\u09C7\u09B0 \u09B8\u09AE\u09DF \u09B9\u09DF\u09C7\u099B\u09C7!</p>
          </div>
          
          <div style="margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor};">
            <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">${task.title}</h2>
            ${task.description ? `<p style="color: #475569; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">${task.description}</p>` : ""}
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 100px;">\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF:</td>
                <td style="padding: 6px 0;">\u{1F4C1} ${task.category}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">\u0985\u0997\u09CD\u09B0\u09BE\u09A7\u09BF\u0995\u09BE\u09B0:</td>
                <td style="padding: 6px 0; color: ${priorityColor}; font-weight: bold;">${priorityLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">\u09A4\u09BE\u09B0\u09BF\u0996 \u0993 \u09B8\u09AE\u09DF:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">\u{1F4C5} ${task.dueDate}  |  \u23F0 ${task.dueTime}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${process.env.APP_URL || "https://ai.studio/build"}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: bold; border-radius: 8px; transition: background-color 0.2s;">
              \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u099F\u09BE\u09B8\u09CD\u0995\u099F\u09BF \u09A6\u09C7\u0996\u09C1\u09A8
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0;">\u098F\u099F\u09BF \u098F\u0995\u099F\u09BF \u09B8\u09CD\u09AC\u09DF\u0982\u0995\u09CD\u09B0\u09BF\u09DF \u0987\u09AE\u09C7\u0987\u09B2\u0964 \u09A6\u09DF\u09BE \u0995\u09B0\u09C7 \u098F\u0996\u09BE\u09A8\u09C7 \u09B8\u09B0\u09BE\u09B8\u09B0\u09BF \u0989\u09A4\u09CD\u09A4\u09B0 \u09A6\u09BF\u09AC\u09C7\u09A8 \u09A8\u09BE\u0964</p>
            <p style="margin: 5px 0 0 0;">\xA9 ${(/* @__PURE__ */ new Date()).getFullYear()} \u099F\u09C1-\u09A1\u09C1 \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u09AA\u09CD\u09B2\u09BF\u0995\u09C7\u09B6\u09A8</p>
          </div>
        </div>
      `;
      const options = {
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: `\u{1F6A8} [\u09B8\u09CD\u09AE\u09BE\u09B0\u0995] \u0997\u09C1\u09B0\u09C1\u09A4\u09CD\u09AC\u09AA\u09C2\u09B0\u09CD\u09A3 \u0995\u09BE\u099C: ${task.title}`,
        html: htmlContent
      };
      const result = await client.sendMail(options);
      console.log("Email reminder processed. MessageId:", result.messageId);
      let previewUrl = null;
      if (result.mock) {
        previewUrl = "mock-preview";
      } else if (import_nodemailer.default.getTestMessageUrl) {
        previewUrl = import_nodemailer.default.getTestMessageUrl(result);
      }
      res.json({
        status: "success",
        messageId: result.messageId,
        previewUrl,
        sentTo: to
      });
    } catch (error) {
      console.error("Email API Route Error:", error);
      res.status(500).json({ error: "\u0987\u09AE\u09C7\u0987\u09B2 \u09B0\u09BF\u09AE\u09BE\u0987\u09A8\u09CD\u09A1\u09BE\u09B0 \u09AA\u09BE\u09A0\u09BE\u09A4\u09C7 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0\u09C7 \u0985\u09AD\u09CD\u09AF\u09A8\u09CD\u09A4\u09B0\u09C0\u09A3 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
    }
  });
  app.post("/api/gemini/suggest-tasks", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "\u0985\u09A8\u09C1\u09B0\u09CB\u09A7\u09C7 \u0995\u09CB\u09A8\u09CB \u09AA\u09CD\u09B0\u09AE\u09CD\u09AA\u099F \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09A8\u09BF\u0964" });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing. Providing fallback response.");
        return res.json({
          status: "fallback",
          tasks: [
            {
              title: "\u09B8\u0995\u09BE\u09B2\u09C7\u09B0 \u09B9\u09BE\u09B2\u0995\u09BE \u09AC\u09CD\u09AF\u09BE\u09DF\u09BE\u09AE \u0993 \u09AE\u09C7\u09A1\u09BF\u099F\u09C7\u09B6\u09A8",
              category: "\u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF",
              priority: "high",
              suggestedTime: "07:00",
              description: "\u09A6\u09BF\u09A8\u099F\u09BF \u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF\u0995\u09B0\u09AD\u09BE\u09AC\u09C7 \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09A4\u09C7 \u09E7\u09E6 \u09AE\u09BF\u09A8\u09BF\u099F \u09B9\u09BE\u09B2\u0995\u09BE \u09AC\u09CD\u09AF\u09BE\u09AF\u09BC\u09BE\u09AE \u098F\u09AC\u0982 \u09A6\u09C0\u09B0\u09CD\u0998 \u09A8\u09BF\u09B6\u09CD\u09AC\u09BE\u09B8 \u09A8\u09BF\u09A8\u0964"
            },
            {
              title: "\u0986\u099C\u0995\u09C7\u09B0 \u09AE\u09C2\u09B2 \u0995\u09BE\u099C\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE (To-Do List) \u09B8\u09BE\u099C\u09BE\u09A8\u09CB",
              category: "\u0995\u09BE\u099C",
              priority: "high",
              suggestedTime: "08:30",
              description: "\u0997\u09C1\u09B0\u09C1\u09A4\u09CD\u09AC\u09AA\u09C2\u09B0\u09CD\u09A3 \u0995\u09BE\u099C\u0997\u09C1\u09B2\u09CB \u0985\u0997\u09CD\u09B0\u09BE\u09A7\u09BF\u0995\u09BE\u09B0 \u0985\u09A8\u09C1\u09AF\u09BE\u09DF\u09C0 \u09B8\u09BE\u099C\u09BF\u09DF\u09C7 \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u09AF\u09C1\u0995\u09CD\u09A4 \u0995\u09B0\u09C1\u09A8\u0964"
            },
            {
              title: "\u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 \u09AA\u09BE\u09A8\u09BF \u09AA\u09BE\u09A8 \u0995\u09B0\u09BE \u0993 \u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09A8\u099F\u09BE\u0987\u09AE \u0995\u09AE\u09BE\u09A8\u09CB",
              category: "\u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF",
              priority: "medium",
              suggestedTime: "11:00",
              description: "\u099F\u09BE\u09A8\u09BE \u098F\u0995 \u0998\u09A3\u09CD\u099F\u09BE\u09B0 \u09AC\u09C7\u09B6\u09BF \u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09A8\u09C7\u09B0 \u09B8\u09BE\u09AE\u09A8\u09C7 \u09A5\u09BE\u0995\u09AC\u09C7\u09A8 \u09A8\u09BE, \u09E7 \u0997\u09CD\u09B2\u09BE\u09B8 \u09AA\u09BE\u09A8\u09BF \u09AA\u09BE\u09A8 \u0995\u09B0\u09C7 \u099A\u09CB\u0996\u0995\u09C7 \u09AC\u09BF\u09B6\u09CD\u09B0\u09BE\u09AE \u09A6\u09BF\u09A8\u0964"
            },
            {
              title: "\u09AA\u099B\u09A8\u09CD\u09A6\u09C7\u09B0 \u09AC\u0987 \u09AA\u09DC\u09BE \u0985\u09A5\u09AC\u09BE \u09A8\u09A4\u09C1\u09A8 \u09A1\u09BE\u09DF\u09C7\u09B0\u09BF \u09B2\u09C7\u0996\u09BE",
              category: "\u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4",
              priority: "low",
              suggestedTime: "21:30",
              description: "\u09A6\u09BF\u09A8\u09B6\u09C7\u09B7\u09C7 \u09E7\u09EB-\u09E8\u09E6 \u09AE\u09BF\u09A8\u09BF\u099F \u09AC\u0987 \u09AA\u09DC\u09BE\u09B0 \u0985\u09AD\u09CD\u09AF\u09BE\u09B8 \u0995\u09B0\u09C1\u09A8 \u09AC\u09BE \u09B8\u09BE\u09B0\u09BE\u09A6\u09BF\u09A8\u09C7\u09B0 \u09AD\u09BE\u09B2\u09CB \u0985\u09AD\u09BF\u099C\u09CD\u099E\u09A4\u09BE\u09B0 \u0995\u09A5\u09BE \u09B2\u09BF\u0996\u09C7 \u09B0\u09BE\u0996\u09C1\u09A8\u0964"
            }
          ]
        });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `\u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0 \u09A4\u09BE\u09B0 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8\u09C7\u09B0 \u0995\u09BE\u099C\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u09B8\u09BE\u099C\u09BE\u09A4\u09C7 \u0993 \u09AA\u09B0\u09BF\u0995\u09B2\u09CD\u09AA\u09A8\u09BE \u0995\u09B0\u09A4\u09C7 \u099A\u09BE\u099A\u09CD\u099B\u09C7\u09A8\u0964 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0\u09B0 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7: "${prompt}"\u0964
\u098F\u0987 \u0985\u09A8\u09C1\u09B0\u09CB\u09A7\u09C7\u09B0 \u09B8\u09BE\u09AA\u09C7\u0995\u09CD\u09B7\u09C7 \u09EA \u09A5\u09C7\u0995\u09C7 \u09EC\u099F\u09BF \u09B8\u09C1\u09A8\u09CD\u09A6\u09B0, \u09AC\u09BE\u09B8\u09CD\u09A4\u09AC\u09B8\u09AE\u09CD\u09AE\u09A4 \u09AC\u09BE\u0982\u09B2\u09BE \u0995\u09BE\u099C\u09C7\u09B0 \u09B0\u09C7\u09A1\u09BF\u09AE\u09BF\u09A1 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE (custom tasks structure) \u09A4\u09C8\u09B0\u09BF \u0995\u09B0\u09C1\u09A8\u0964
\u09AC\u09BE\u0999\u09BE\u09B2\u09BF\u09AF\u09BC\u09BE\u09A8\u09BE \u0990\u09A4\u09BF\u09B9\u09CD\u09AF \u0985\u09A5\u09AC\u09BE \u0986\u09A7\u09C1\u09A8\u09BF\u0995 \u09AA\u09CD\u09B0\u09BE\u09A4\u09CD\u09AF\u09B9\u09BF\u0995 \u09A6\u09BF\u09A8\u09C7\u09B0 \u09B8\u09BE\u09A5\u09C7 \u09AE\u09BE\u09A8\u09BE\u09A8\u09B8\u0987 \u0993 \u09B8\u09CD\u09AA\u09B7\u09CD\u099F \u09B6\u09AC\u09CD\u09A6 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09C1\u09A8\u0964
\u09AA\u09CD\u09B0\u09A4\u09BF\u099F\u09BF \u0995\u09BE\u099C\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09A6\u09BF\u09A8:
\u09E7. title (\u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE - \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC)
\u09E8. category (\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF - \u0985\u09AC\u09BF\u0995\u09B2 \u098F\u0987 \u09EB\u099F\u09BF \u09AE\u09C2\u09B2 \u09AE\u09BE\u09A8\u09C7\u09B0 \u098F\u0995\u099F\u09BF \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7: "\u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4", "\u0995\u09BE\u099C", "\u09AA\u09DC\u09BE\u09B6\u09CB\u09A8\u09BE", "\u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF", "\u0985\u09A8\u09CD\u09AF\u09BE\u09A8\u09CD\u09AF")
\u09E9. priority (\u0985\u0997\u09CD\u09B0\u09BE\u09A7\u09BF\u0995\u09BE\u09B0 - \u0985\u09AC\u09BF\u0995\u09B2 \u098F\u0987 \u09E9\u099F\u09BF \u09AE\u09BE\u09A8\u09C7\u09B0 \u098F\u0995\u099F\u09BF \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7: "high", "medium", \u09AC\u09BE "low")
\u09EA. suggestedTime (\u09B8\u09AE\u09CD\u09AD\u09BE\u09AC\u09CD\u09AF \u09B8\u09AE\u09DF - \u09E8\u09EA \u0998\u09A3\u09CD\u099F\u09BE\u09B0 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F\u09C7 HH:MM \u09AF\u09C7\u09AE\u09A8 "08:30", "13:00" \u0985\u09A5\u09AC\u09BE \u0996\u09BE\u09B2\u09BF \u09B8\u09CD\u099F\u09CD\u09B0\u09BF\u0982 "" \u09AF\u09A6\u09BF \u09B8\u09AE\u09DF \u09A8\u09BF\u09B0\u09CD\u09A6\u09BF\u09B7\u09CD\u099F \u09A8\u09BE \u09A5\u09BE\u0995\u09C7)
\u09EB. description (\u099B\u09CB\u099F \u09AC\u09B0\u09CD\u09A3\u09A8\u09BE \u09AC\u09BE \u099F\u09BF\u09AA\u09B8 - \u09AC\u09BE\u0982\u09B2\u09BE\u09AF\u09BC)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              tasks: {
                type: import_genai.Type.ARRAY,
                items: {
                  type: import_genai.Type.OBJECT,
                  properties: {
                    title: { type: import_genai.Type.STRING, description: "\u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u0995\u09BE\u099C\u09C7\u09B0 \u09B6\u09BF\u09B0\u09CB\u09A8\u09BE\u09AE" },
                    category: { type: import_genai.Type.STRING, description: "\u0995\u09BE\u099C\u09C7\u09B0 \u09A7\u09B0\u09A3: '\u09AC\u09CD\u09AF\u0995\u09CD\u09A4\u09BF\u0997\u09A4' / '\u0995\u09BE\u099C' / '\u09AA\u09DC\u09BE\u09B6\u09CB\u09A8\u09BE' / '\u09B8\u09CD\u09AC\u09BE\u09B8\u09CD\u09A5\u09CD\u09AF' / '\u0985\u09A8\u09CD\u09AF\u09BE\u09A8\u09CD\u09AF'" },
                    priority: { type: import_genai.Type.STRING, description: "'high' / 'medium' / 'low'" },
                    suggestedTime: { type: import_genai.Type.STRING, description: "\u09E8\u09EA \u0998\u09A3\u09CD\u099F\u09BE\u09B0 \u09AB\u09B0\u09AE\u09CD\u09AF\u09BE\u099F HH:MM \u09AC\u09BE empty string" },
                    description: { type: import_genai.Type.STRING, description: "\u09AC\u09BE\u0982\u09B2\u09BE\u09DF \u09E7 \u09B2\u09BE\u0987\u09A8\u09C7\u09B0 \u0995\u09BE\u099C\u09C7\u09B0 \u09AC\u09B0\u09CD\u09A3\u09A8\u09BE" }
                  },
                  required: ["title", "category", "priority", "description"]
                }
              }
            },
            required: ["tasks"]
          }
        }
      });
      const text = response.text || "{}";
      const data = JSON.parse(text.trim());
      res.json({ status: "success", tasks: data.tasks || [] });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Gemini \u098F\u09AA\u09BF\u0986\u0987 \u0995\u09BE\u099C \u0995\u09B0\u099B\u09C7 \u09A8\u09BE \u09AC\u09BE \u0985\u09AD\u09CD\u09AF\u09A8\u09CD\u09A4\u09B0\u09C0\u09A3 \u09A4\u09CD\u09B0\u09C1\u099F\u09BF \u0998\u099F\u09C7\u099B\u09C7\u0964" });
    }
  });
  const backupsDir = import_path.default.join(process.cwd(), "backups");
  if (!import_fs.default.existsSync(backupsDir)) {
    import_fs.default.mkdirSync(backupsDir, { recursive: true });
  }
  app.post("/api/backup/save", (req, res) => {
    try {
      const { tasks, label } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "\u09B8\u09A0\u09BF\u0995 \u0995\u09BE\u099C\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09C1\u09A8\u0964" });
      }
      const backupId = `backup-${Date.now()}`;
      const filename = `${backupId}.json`;
      const filePath = import_path.default.join(backupsDir, filename);
      const backupData = {
        id: backupId,
        label: label || `\u09B8\u09CD\u09AC\u09DF\u0982\u0995\u09CD\u09B0\u09BF\u09DF \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        tasksCount: tasks.length,
        tasks
      };
      import_fs.default.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
      res.json({
        status: "success",
        backup: {
          id: backupId,
          filename,
          label: backupData.label,
          timestamp: backupData.timestamp,
          tasksCount: backupData.tasksCount
        }
      });
    } catch (error) {
      console.error("Backup Save Error:", error);
      res.status(500).json({ error: "\u0995\u09CD\u09B2\u09BE\u0989\u09A1 \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u09B8\u0982\u09B0\u0995\u09CD\u09B7\u09A3\u09C7 \u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0\u09C7 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
    }
  });
  app.get("/api/backup/list", (req, res) => {
    try {
      if (!import_fs.default.existsSync(backupsDir)) {
        return res.json({ status: "success", backups: [] });
      }
      const files = import_fs.default.readdirSync(backupsDir);
      const backups = files.filter((file) => file.startsWith("backup-") && file.endsWith(".json")).map((file) => {
        const filePath = import_path.default.join(backupsDir, file);
        try {
          const raw = import_fs.default.readFileSync(filePath, "utf8");
          const parsed = JSON.parse(raw);
          return {
            id: parsed.id || file.replace(".json", ""),
            filename: file,
            label: parsed.label || "\u09A8\u09BE\u09AE\u09AC\u09BF\u09B9\u09C0\u09A8 \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA",
            timestamp: parsed.timestamp || import_fs.default.statSync(filePath).mtime.toISOString(),
            tasksCount: parsed.tasksCount || (Array.isArray(parsed.tasks) ? parsed.tasks.length : 0),
            size: import_fs.default.statSync(filePath).size
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      res.json({ status: "success", backups });
    } catch (error) {
      console.error("Backup List Error:", error);
      res.status(500).json({ error: "\u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA\u09C7\u09B0 \u09A4\u09BE\u09B2\u09BF\u0995\u09BE \u09A6\u09C7\u0996\u09A4\u09C7 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
    }
  });
  app.post("/api/backup/restore", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== "string") {
        return res.status(400).json({ error: "\u09B8\u09A0\u09BF\u0995 \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u09AB\u09BE\u0987\u09B2 \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09C1\u09A8\u0964" });
      }
      const secureFilename = import_path.default.basename(filename);
      const filePath = import_path.default.join(backupsDir, secureFilename);
      if (!import_fs.default.existsSync(filePath)) {
        return res.status(404).json({ error: "\u09A6\u09C1\u0983\u0996\u09BF\u09A4, \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u09AB\u09BE\u0987\u09B2\u099F\u09BF \u0996\u09C1\u0981\u099C\u09C7 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964" });
      }
      const raw = import_fs.default.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      res.json({
        status: "success",
        tasks: parsed.tasks || [],
        label: parsed.label,
        timestamp: parsed.timestamp
      });
    } catch (error) {
      console.error("Backup Restore Error:", error);
      res.status(500).json({ error: "\u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u09B0\u09BF\u09B8\u09CD\u099F\u09CB\u09B0 \u0995\u09B0\u09BE\u09B0 \u09B8\u09AE\u09DF \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
    }
  });
  app.post("/api/backup/delete", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== "string") {
        return res.status(400).json({ error: "\u09B8\u09A0\u09BF\u0995 \u09AC\u09CD\u09AF\u09BE\u0995\u0986\u09AA \u09AB\u09BE\u0987\u09B2 \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09C1\u09A8\u0964" });
      }
      const secureFilename = import_path.default.basename(filename);
      const filePath = import_path.default.join(backupsDir, secureFilename);
      if (import_fs.default.existsSync(filePath)) {
        import_fs.default.unlinkSync(filePath);
      }
      res.json({ status: "success" });
    } catch (error) {
      console.error("Backup Delete Error:", error);
      res.status(500).json({ error: "\u09B0\u09BF\u09B8\u09CD\u099F\u09CB\u09B0 \u09AB\u09BE\u0987\u09B2 \u09AE\u09C1\u099B\u09A4\u09C7 \u09B8\u09AE\u09B8\u09CD\u09AF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964" });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
