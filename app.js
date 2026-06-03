const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.CHANNEL_ACCESS_TOKEN;

// ======================
// DATABASE
// ======================

let groups = {};

try {
  groups = JSON.parse(
    fs.readFileSync("groups.json", "utf8")
  );
} catch {
  groups = {};
}

function saveData() {
  fs.writeFileSync(
    "groups.json",
    JSON.stringify(groups, null, 2)
  );
}

function getGroup(groupId) {

  if (!groups[groupId]) {

    groups[groupId] = {

      owner: null,

      admins: [],

      blacklist: [],

      badwords: [],

      settings: {

        antiLink: false,
        antiContact: false,
        antiImage: false,
        antiVideo: false,
        antiSticker: false,

        welcome: false,
        leave: false
      },

      welcomeMessage:
        "👋 ยินดีต้อนรับสมาชิกใหม่",

      leaveMessage:
        "👋 สมาชิกได้ออกจากกลุ่มแล้ว"
    };

    saveData();
  }

  return groups[groupId];
}

// ======================
// REPLY
// ======================

async function reply(replyToken, text) {

  try {

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken,
        messages: [
          {
            type: "text",
            text
          }
        ]
      },
      {
        headers: {
          Authorization:
            `Bearer ${TOKEN}`,
          "Content-Type":
            "application/json"
        }
      }
    );

  } catch (err) {

    console.log(err.message);

  }
}
// ======================
// WEBHOOK
// ======================

app.post("/webhook", async (req, res) => {

  const events = req.body.events || [];

  for (const event of events) {

    if (
      event.type !== "message" ||
      event.message.type !== "text"
    ) {
      continue;
    }

    const text =
      event.message.text.trim();

    const replyToken =
      event.replyToken;

    const groupId =
      event.source.groupId ||
      event.source.roomId;

    const userId =
      event.source.userId;

    if (!groupId) continue;

    const group =
      getGroup(groupId);

    if (!group.owner) {

      group.owner = userId;

      saveData();

    }

    const isOwner =
      userId === group.owner;

    const isAdmin =
      isOwner ||
      group.admins.includes(userId);

    // ======================
    // ออน
    // ======================

    if (text === "ออน") {

      return reply(
        replyToken,
        `✅ ATM LEAN BOT V2 ONLINE

⏰ ${new Date().toLocaleString("th-TH")}`
      );

    }

    // ======================
    // บอท
    // ======================

    if (text === "บอท") {

      return reply(
        replyToken,
        `🤖 ATM LEAN BOT V2

👑 Owner : ATM LEAN
🟢 Status : ONLINE`
      );

    }

    // ======================
    // ตั้งค่า
    // ======================

    if (text === "ตั้งค่า") {

      return reply(
        replyToken,

`⚙️ SETTINGS

กันลิงก์ : ${
group.settings.antiLink ? "เปิด" : "ปิด"
}

กันคอนแทค : ${
group.settings.antiContact ? "เปิด" : "ปิด"
}

กันรูป : ${
group.settings.antiImage ? "เปิด" : "ปิด"
}

กันวิดีโอ : ${
group.settings.antiVideo ? "เปิด" : "ปิด"
}

กันสติ๊กเกอร์ : ${
group.settings.antiSticker ? "เปิด" : "ปิด"
}

ต้อนรับ : ${
group.settings.welcome ? "เปิด" : "ปิด"
}

คนออก : ${
group.settings.leave ? "เปิด" : "ปิด"
}`
      );

    }

    // ======================
    // OWNER
    // ======================

    if (text === "เจ้าของกลุ่ม") {

      return reply(
        replyToken,
        `👑 OWNER ID

${group.owner}`
      );

    }
    // ======================
    // เช็คแอด
    // ======================

    if (text === "เช็คแอด") {

      return reply(
        replyToken,

`👑 OWNER

${group.owner || "-"}

⭐ ADMINS

${group.admins.length > 0
  ? group.admins.join("\n")
  : "ไม่มีแอดมิน"}`
      );

    }

    // ======================
    // เพิ่มแอด
    // เพิ่มแอด USERID
    // ======================

    if (text.startsWith("เพิ่มแอด ")) {

      if (!isOwner) {

        return reply(
          replyToken,
          "❌ เฉพาะเจ้าของกลุ่ม"
        );

      }

      const target =
        text.replace(
          "เพิ่มแอด ",
          ""
        ).trim();

      if (!target) {

        return reply(
          replyToken,
          "❌ กรุณาใส่ USER ID"
        );

      }

      if (
        !group.admins.includes(
          target
        )
      ) {

        group.admins.push(
          target
        );

        saveData();

      }

      return reply(
        replyToken,
        "✅ เพิ่มแอดมินแล้ว"
      );

    }

    // ======================
    // ลบแอด
    // ======================

    if (text.startsWith("ลบแอด ")) {

      if (!isOwner) {

        return reply(
          replyToken,
          "❌ เฉพาะเจ้าของกลุ่ม"
        );

      }

      const target =
        text.replace(
          "ลบแอด ",
          ""
        ).trim();

      group.admins =
        group.admins.filter(
          x => x !== target
        );

      saveData();

      return reply(
        replyToken,
        "🗑️ ลบแอดมินแล้ว"
      );

    }

    // ======================
    // รายชื่อแอดมิน
    // ======================

    if (
      text ===
      "รายชื่อแอดมิน"
    ) {

      return reply(
        replyToken,

`⭐ ADMIN LIST

${group.admins.length
? group.admins.join("\n")
: "ไม่มีแอดมิน"}`
      );

    }
    // ======================
    // เพิ่มดำ
    // ======================

    if (text.startsWith("เพิ่มดำ ")) {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      const target =
        text.replace(
          "เพิ่มดำ ",
          ""
        ).trim();

      if (
        !group.blacklist.includes(
          target
        )
      ) {

        group.blacklist.push(
          target
        );

        saveData();

      }

      return reply(
        replyToken,
        "🚫 เพิ่มบัญชีดำแล้ว"
      );

    }

    // ======================
    // ลบดำ
    // ======================

    if (text.startsWith("ลบดำ ")) {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      const target =
        text.replace(
          "ลบดำ ",
          ""
        ).trim();

      group.blacklist =
        group.blacklist.filter(
          x => x !== target
        );

      saveData();

      return reply(
        replyToken,
        "✅ ลบบัญชีดำแล้ว"
      );

    }

    // ======================
    // เช็คดำ
    // ======================

    if (
      text === "เช็คดำ" ||
      text === "รายชื่อดำ"
    ) {

      return reply(
        replyToken,

`🚫 BLACKLIST

${group.blacklist.length
? group.blacklist.join("\n")
: "ไม่มีบัญชีดำ"}`
      );

    }

    // ======================
    // ล้างดำ
    // ======================

    if (text === "ล้างดำ") {

      if (!isAdmin) {

        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );

      }

      group.blacklist = [];

      saveData();

      return reply(
        replyToken,
        "🗑️ ล้างบัญชีดำแล้ว"
      );

    }

    // ======================
    // เพิ่มห้ามพิมพ์
    // ======================

    if (
      text.startsWith(
        "เพิ่มห้ามพิมพ์ "
      )
    ) {

      if (!isAdmin) {

        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );

      }

      const word =
        text.replace(
          "เพิ่มห้ามพิมพ์ ",
          ""
        ).trim();

      if (
        !group.badwords.includes(
          word
        )
      ) {

        group.badwords.push(
          word
        );

        saveData();

      }

      return reply(
        replyToken,
        `✅ เพิ่มคำต้องห้าม : ${word}`
      );

    }

    // ======================
    // ลบห้ามพิมพ์
    // ======================

    if (
      text.startsWith(
        "ลบห้ามพิมพ์ "
      )
    ) {

      if (!isAdmin) {

        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );

      }

      const word =
        text.replace(
          "ลบห้ามพิมพ์ ",
          ""
        ).trim();

      group.badwords =
        group.badwords.filter(
          x => x !== word
        );

      saveData();

      return reply(
        replyToken,
        `🗑️ ลบคำต้องห้าม : ${word}`
      );

    }

    // ======================
    // เช็คห้ามพิมพ์
    // ======================

    if (
      text === "เช็คห้ามพิมพ์"
    ) {

      return reply(
        replyToken,

`📋 BADWORDS

${group.badwords.length
? group.badwords.join("\n")
: "ไม่มีคำต้องห้าม"}`
      );

    }

    // ======================
    // ตรวจคำต้องห้าม
    // ======================

    for (
      const badword of
      group.badwords
    ) {

      if (
        text.includes(
          badword
        )
      ) {

        return reply(
          replyToken,
          "🚫 พบคำต้องห้าม"
        );

      }

    }
    // ======================
    // เปิดกันลิงก์
    // ======================

    if (text === "กันลิงก์ เปิด") {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.settings.antiLink = true;

      saveData();

      return reply(
        replyToken,
        "🛡️ เปิดกันลิงก์แล้ว"
      );

    }

    // ======================
    // ปิดกันลิงก์
    // ======================

    if (text === "กันลิงก์ ปิด") {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.settings.antiLink = false;

      saveData();

      return reply(
        replyToken,
        "🛡️ ปิดกันลิงก์แล้ว"
      );

    }

    // ======================
    // ตรวจลิงก์
    // ======================

    if (
      group.settings.antiLink &&
      /(http|https):\/\/|line\.me/i.test(text)
    ) {

      return reply(
        replyToken,
        "🚫 ห้ามส่งลิงก์"
      );

    }

    // ======================
    // เปิดต้อนรับ
    // ======================

    if (text === "ต้อนรับ เปิด") {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.settings.welcome = true;

      saveData();

      return reply(
        replyToken,
        "👋 เปิดต้อนรับแล้ว"
      );

    }

    // ======================
    // ปิดต้อนรับ
    // ======================

    if (text === "ต้อนรับ ปิด") {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.settings.welcome = false;

      saveData();

      return reply(
        replyToken,
        "👋 ปิดต้อนรับแล้ว"
      );

    }

    // ======================
    // ตั้งข้อความต้อนรับ
    // ======================

    if (
      text.startsWith(
        "ตั้งต้อนรับ:"
      )
    ) {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.welcomeMessage =
        text.replace(
          "ตั้งต้อนรับ:",
          ""
        ).trim();

      saveData();

      return reply(
        replyToken,
        "✅ บันทึกข้อความต้อนรับแล้ว"
      );

    }

    // ======================
    // เช็คต้อนรับ
    // ======================

    if (
      text === "เช็คต้อนรับ"
    ) {

      return reply(
        replyToken,
        group.welcomeMessage
      );

    }

    // ======================
    // เปิดคนออก
    // ======================

    if (text === "คนออก เปิด") {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.settings.leave = true;

      saveData();

      return reply(
        replyToken,
        "👋 เปิดแจ้งคนออกแล้ว"
      );

    }

    // ======================
    // ปิดคนออก
    // ======================

    if (text === "คนออก ปิด") {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.settings.leave = false;

      saveData();

      return reply(
        replyToken,
        "👋 ปิดแจ้งคนออกแล้ว"
      );

    }

    // ======================
    // ตั้งข้อความคนออก
    // ======================

    if (
      text.startsWith(
        "ตั้งคนออก:"
      )
    ) {

      if (!isAdmin) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      group.leaveMessage =
        text.replace(
          "ตั้งคนออก:",
          ""
        ).trim();

      saveData();

      return reply(
        replyToken,
        "✅ บันทึกข้อความคนออกแล้ว"
      );

    }

    // ======================
    // เช็คคนออก
    // ======================

    if (
      text === "เช็คคนออก"
    ) {

      return reply(
        replyToken,
        group.leaveMessage
      );

    }
    }

  res.sendStatus(200);

});

// ======================
// HOME
// ======================

app.get("/", (req, res) => {

  res.send(
    "🔥 ATM LEAN BOT V2 ONLINE"
  );

});

// ======================
// START SERVER
// ======================

app.listen(PORT, () => {

  console.log(
    `🔥 ATM LEAN BOT V2 RUNNING ON PORT ${PORT}`
  );

});