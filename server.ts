import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import fs from "fs";

dotenv.config();

let transporter: any = null;

async function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    console.log("Initializing real SMTP transporter using configuration.");
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  } else {
    try {
      console.log("SMTP credentials missing. Attempting to create an Ethereal sandbox SMTP account...");
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`Ethereal test SMTP mailbox provisioned: ${testAccount.user}`);
    } catch (err) {
      console.warn("Failed to create Ethereal SMTP workspace, falling back to clean terminal mocks:", err);
      transporter = {
        sendMail: async (options: any) => {
          console.log("\n==== 📧 TO-DO REMINDER NOTIFICATION SENDING MOCK ====");
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
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to send email reminders
  app.post("/api/email/send-reminder", async (req, res) => {
    try {
      const { to, task } = req.body;
      if (!to || !task) {
        return res.status(400).json({ error: "অনুরোধে সঠিক ইমেইল বা টাস্কের তথ্য পাওয়া যায়নি।" });
      }

      const client = await getTransporter();

      const priorityLabel = task.priority === "high" ? "🚨 উচ্চ" : task.priority === "medium" ? "⚡ মধ্যম" : "🌱 সাধারণ";
      const priorityColor = task.priority === "high" ? "#dc2626" : task.priority === "medium" ? "#d97706" : "#059669";

      const fromName = process.env.SMTP_FROM_NAME || "টাস্ক রিমাইন্ডার এজেন্ট";
      const fromEmail = process.env.SMTP_FROM_EMAIL || "noreply@ais-todo.com";

      const htmlContent = `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 25px;">
            <h1 style="color: #10b981; margin: 0; font-size: 24px;">📅 টাস্ক রিমাইন্ডার নোটিফিকেশন</h1>
            <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px;">আপনার একটি গুরুত্বপূর্ণ কাজের সময় হয়েছে!</p>
          </div>
          
          <div style="margin-bottom: 25px; background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${priorityColor};">
            <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">${task.title}</h2>
            ${task.description ? `<p style="color: #475569; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">${task.description}</p>` : ''}
            
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #475569;">
              <tr>
                <td style="padding: 6px 0; font-weight: bold; width: 100px;">ক্যাটাগরি:</td>
                <td style="padding: 6px 0;">📁 ${task.category}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">অগ্রাধিকার:</td>
                <td style="padding: 6px 0; color: ${priorityColor}; font-weight: bold;">${priorityLabel}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-weight: bold;">তারিখ ও সময়:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #0f172a;">📅 ${task.dueDate}  |  ⏰ ${task.dueTime}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-bottom: 25px;">
            <a href="${process.env.APP_URL || 'https://ai.studio/build'}" style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 14px; font-weight: bold; border-radius: 8px; transition: background-color 0.2s;">
              অ্যাপে টাস্কটি দেখুন
            </a>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 11px;">
            <p style="margin: 0;">এটি একটি স্বয়ংক্রিয় ইমেইল। দয়া করে এখানে সরাসরি উত্তর দিবেন না।</p>
            <p style="margin: 5px 0 0 0;">© ${new Date().getFullYear()} টু-ডু রিমাইন্ডার অ্যাপ্লিকেশন</p>
          </div>
        </div>
      `;

      const options = {
        from: `"${fromName}" <${fromEmail}>`,
        to: to,
        subject: `🚨 [স্মারক] গুরুত্বপূর্ণ কাজ: ${task.title}`,
        html: htmlContent,
      };

      const result = await client.sendMail(options);
      console.log("Email reminder processed. MessageId:", result.messageId);

      // Return a preview link if it's ethereal sandbox
      let previewUrl = null;
      if (result.mock) {
        previewUrl = "mock-preview";
      } else if (nodemailer.getTestMessageUrl) {
        previewUrl = nodemailer.getTestMessageUrl(result);
      }

      res.json({
        status: "success",
        messageId: result.messageId,
        previewUrl: previewUrl,
        sentTo: to
      });

    } catch (error: any) {
      console.error("Email API Route Error:", error);
      res.status(500).json({ error: "ইমেইল রিমাইন্ডার পাঠাতে সার্ভারে অভ্যন্তরীণ সমস্যা হয়েছে।" });
    }
  });

  // API Route for Gemini suggestions
  app.post("/api/gemini/suggest-tasks", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "অনুরোধে কোনো প্রম্পট দেওয়া হয়নি।" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.warn("GEMINI_API_KEY is missing. Providing fallback response.");
        return res.json({
          status: "fallback",
          tasks: [
            {
              title: "সকালের হালকা ব্যায়াম ও মেডিটেশন",
              category: "স্বাস্থ্য",
              priority: "high",
              suggestedTime: "07:00",
              description: "দিনটি স্বাস্থ্যকরভাবে শুরু করতে ১০ মিনিট হালকা ব্যায়াম এবং দীর্ঘ নিশ্বাস নিন।"
            },
            {
              title: "আজকের মূল কাজের তালিকা (To-Do List) সাজানো",
              category: "কাজ",
              priority: "high",
              suggestedTime: "08:30",
              description: "গুরুত্বপূর্ণ কাজগুলো অগ্রাধিকার অনুযায়ী সাজিয়ে অ্যাপে যুক্ত করুন।"
            },
            {
              title: "পর্যাপ্ত পানি পান করা ও স্ক্রিনটাইম কমানো",
              category: "স্বাস্থ্য",
              priority: "medium",
              suggestedTime: "11:00",
              description: "টানা এক ঘণ্টার বেশি স্ক্রিনের সামনে থাকবেন না, ১ গ্লাস পানি পান করে চোখকে বিশ্রাম দিন।"
            },
            {
              title: "পছন্দের বই পড়া অথবা নতুন ডায়েরি লেখা",
              category: "ব্যক্তিগত",
              priority: "low",
              suggestedTime: "21:30",
              description: "দিনশেষে ১৫-২০ মিনিট বই পড়ার অভ্যাস করুন বা সারাদিনের ভালো অভিজ্ঞতার কথা লিখে রাখুন।"
            }
          ]
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `ব্যবহারকারী তার প্রতিদিনের কাজের তালিকা সাজাতে ও পরিকল্পনা করতে চাচ্ছেন। ব্যবহারকারীর অনুরোধ: "${prompt}"।
এই অনুরোধের সাপেক্ষে ৪ থেকে ৬টি সুন্দর, বাস্তবসম্মত বাংলা কাজের রেডিমিড তালিকা (custom tasks structure) তৈরি করুন।
বাঙালিয়ানা ঐতিহ্য অথবা আধুনিক প্রাত্যহিক দিনের সাথে মানানসই ও স্পষ্ট শব্দ ব্যবহার করুন।
প্রতিটি কাজের জন্য দিন:
১. title (শিরোনাম - বাংলায়)
২. category (ক্যাটাগরি - অবিকল এই ৫টি মূল মানের একটি হতে হবে: "ব্যক্তিগত", "কাজ", "পড়াশোনা", "স্বাস্থ্য", "অন্যান্য")
৩. priority (অগ্রাধিকার - অবিকল এই ৩টি মানের একটি হতে হবে: "high", "medium", বা "low")
৪. suggestedTime (সম্ভাব্য সময় - ২৪ ঘণ্টার ফরম্যাটে HH:MM যেমন "08:30", "13:00" অথবা খালি স্ট্রিং "" যদি সময় নির্দিষ্ট না থাকে)
৫. description (ছোট বর্ণনা বা টিপস - বাংলায়)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "বাংলায় কাজের শিরোনাম" },
                    category: { type: Type.STRING, description: "কাজের ধরণ: 'ব্যক্তিগত' / 'কাজ' / 'পড়াশোনা' / 'স্বাস্থ্য' / 'অন্যান্য'" },
                    priority: { type: Type.STRING, description: "'high' / 'medium' / 'low'" },
                    suggestedTime: { type: Type.STRING, description: "২৪ ঘণ্টার ফরম্যাট HH:MM বা empty string" },
                    description: { type: Type.STRING, description: "বাংলায় ১ লাইনের কাজের বর্ণনা" }
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

    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Gemini এপিআই কাজ করছে না বা অভ্যন্তরীণ ত্রুটি ঘটেছে।" });
    }
  });

  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  // API Route to save to-do backup
  app.post("/api/backup/save", (req, res) => {
    try {
      const { tasks, label } = req.body;
      if (!Array.isArray(tasks)) {
        return res.status(400).json({ error: "সঠিক কাজের তালিকা প্রদান করুন।" });
      }

      const backupId = `backup-${Date.now()}`;
      const filename = `${backupId}.json`;
      const filePath = path.join(backupsDir, filename);

      const backupData = {
        id: backupId,
        label: label || `স্বয়ংক্রিয় ব্যাকআপ`,
        timestamp: new Date().toISOString(),
        tasksCount: tasks.length,
        tasks
      };

      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
      res.json({
        status: "success",
        backup: {
          id: backupId,
          filename,
          label: backupData.label,
          timestamp: backupData.timestamp,
          tasksCount: backupData.tasksCount,
        }
      });
    } catch (error: any) {
      console.error("Backup Save Error:", error);
      res.status(500).json({ error: "ক্লাউড ব্যাকআপ সংরক্ষণে সার্ভারে সমস্যা হয়েছে।" });
    }
  });

  // API Route to list backups
  app.get("/api/backup/list", (req, res) => {
    try {
      if (!fs.existsSync(backupsDir)) {
        return res.json({ status: "success", backups: [] });
      }

      const files = fs.readdirSync(backupsDir);
      const backups = files
        .filter(file => file.startsWith("backup-") && file.endsWith(".json"))
        .map(file => {
          const filePath = path.join(backupsDir, file);
          try {
            const raw = fs.readFileSync(filePath, "utf8");
            const parsed = JSON.parse(raw);
            return {
              id: parsed.id || file.replace(".json", ""),
              filename: file,
              label: parsed.label || "নামবিহীন ব্যাকআপ",
              timestamp: parsed.timestamp || fs.statSync(filePath).mtime.toISOString(),
              tasksCount: parsed.tasksCount || (Array.isArray(parsed.tasks) ? parsed.tasks.length : 0),
              size: fs.statSync(filePath).size
            };
          } catch (e) {
            return null;
          }
        })
        .filter(Boolean)
        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      res.json({ status: "success", backups });
    } catch (error: any) {
      console.error("Backup List Error:", error);
      res.status(500).json({ error: "ব্যাকআপের তালিকা দেখতে সমস্যা হয়েছে।" });
    }
  });

  // API Route to restore a backup
  app.post("/api/backup/restore", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== "string") {
        return res.status(400).json({ error: "সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।" });
      }

      const secureFilename = path.basename(filename);
      const filePath = path.join(backupsDir, secureFilename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "দুঃখিত, ব্যাকআপ ফাইলটি খুঁজে পাওয়া যায়নি।" });
      }

      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      
      res.json({ 
        status: "success", 
        tasks: parsed.tasks || [],
        label: parsed.label,
        timestamp: parsed.timestamp
      });
    } catch (error: any) {
      console.error("Backup Restore Error:", error);
      res.status(500).json({ error: "ব্যাকআপ রিস্টোর করার সময় সমস্যা হয়েছে।" });
    }
  });

  // API Route to delete a backup
  app.post("/api/backup/delete", (req, res) => {
    try {
      const { filename } = req.body;
      if (!filename || typeof filename !== "string") {
        return res.status(400).json({ error: "সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।" });
      }

      const secureFilename = path.basename(filename);
      const filePath = path.join(backupsDir, secureFilename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ status: "success" });
    } catch (error: any) {
      console.error("Backup Delete Error:", error);
      res.status(500).json({ error: "রিস্টোর ফাইল মুছতে সমস্যা হয়েছে।" });
    }
  });

  // Serve static files in production, mount Vite in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
