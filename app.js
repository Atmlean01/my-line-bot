const express = require("express");
const axios = require("axios");

const app = express();
app.use(express.json());

const TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;

let groups = {};

function getGroup(id) {
  if (!groups[id]) {
    groups[id] = {
      antiLink: false,
      welcome: false,
      lock: false,
      owner: null,
      blacklist: [],
      admins: {
        high: [],
        mid: [],
        low: []
      }
    };
  }
  return groups[id];
}

app.post("/webhook", async (req, res) => {
  const events = req.body.events || [];

  for (const e of events) {

    if (e.type !== "message") continue;
    if (e.message.type !== "text") continue;

    const text = e.message.text.trim();
    const replyToken = e.replyToken;

    const groupId =
      e.source.groupId ||
      e.source.roomId;

    const userId = e.source.userId;

    if (!groupId) continue;

    const group = getGroup(groupId);

    if (!group.owner)
      group.owner = userId;

    const isOwner =
      userId === group.owner;

    const isHigh =
      group.admins.high.includes(userId);

    const isMid =
      group.admins.mid.includes(userId);

    const isLow =
      group.admins.low.includes(userId);

    const isAdmin =
      isOwner || isHigh || isMid || isLow;

    // กันลิงก์
    if (
      group.antiLink &&
      /(http|https):\/\//i.test(text)
    ) {
      await reply(
        replyToken,
        "🚫 ห้ามส่งลิงก์"
      );
      continue;
    }

    // เมนู
    if (text === "เมนู") {
      await reply(
        replyToken,
`🤖 เมนูบอท

📊 ข้อมูล
• สถานะ
• เช็คเจ้าของ

🛡️ ระบบป้องกัน
• เปิดกันลิงก์
• ปิดกันลิงก์

👋 ระบบต้อนรับ
• เปิดต้อนรับ
• ปิดต้อนรับ

👑 แอดมิน
• ตั้งสูง UID
• ตั้งกลาง UID
• ตั้งล่าง UID
• ลบแอดมิน UID
• รายชื่อแอดมิน

🚫 Blacklist
• เพิ่มดำ UID
• ลบดำ UID
• รายชื่อดำ

🔒 กลุ่ม
• ล็อกกลุ่ม
• ปลดล็อกกลุ่ม`
      );
    }

    // สถานะ
    if (text === "สถานะ") {
      await reply(
        replyToken,
        JSON.stringify(group, null, 2)
      );
    }

    // เช็คแอด
if (text === "เช็คแอด") {
  return reply(
    replyToken,
`╔════ 👑 OWNER 👑 ════╗

👤 ชื่อ : Atm Lean
🟢 สถานะ : Online
👑 ระดับ : Owner

╚══════════════════╝`
  );
}

    // เปิดกันลิงก์
    if (text === "เปิดกันลิงก์") {
      if (!isOwner && !isHigh)
        return reply(
          replyToken,
          "❌ เฉพาะเจ้าของ/แอดสูง"
        );

      group.antiLink = true;

      return reply(
        replyToken,
        "🔒 เปิดกันลิงก์แล้ว"
      );
    }

    // ปิดกันลิงก์
    if (text === "ปิดกันลิงก์") {
      if (!isOwner && !isHigh)
        return reply(
          replyToken,
          "❌ เฉพาะเจ้าของ/แอดสูง"
        );

      group.antiLink = false;

      return reply(
        replyToken,
        "🔓 ปิดกันลิงก์แล้ว"
      );
    }

    // เปิดต้อนรับ
    if (text === "เปิดต้อนรับ") {
      group.welcome = true;

      return reply(
        replyToken,
        "👋 เปิดต้อนรับแล้ว"
      );
    }

    // ปิดต้อนรับ
    if (text === "ปิดต้อนรับ") {
      group.welcome = false;

      return reply(
        replyToken,
        "👋 ปิดต้อนรับแล้ว"
      );
    }

    // ล็อกกลุ่ม
    if (text === "ล็อกกลุ่ม") {
      group.lock = true;

      return reply(
        replyToken,
        "🔒 ล็อกกลุ่มแล้ว"
      );
    }

    // ปลดล็อกกลุ่ม
    if (text === "ปลดล็อกกลุ่ม") {
      group.lock = false;

      return reply(
        replyToken,
        "🔓 ปลดล็อกกลุ่มแล้ว"
      );
    }

    // ตั้งสูง
    if (text.startsWith("ตั้งสูง ")) {

      if (!isOwner)
        return reply(
          replyToken,
          "❌ เฉพาะเจ้าของ"
        );

      const target =
        text.split(" ")[1];

      if (
        !group.admins.high.includes(
          target
        )
      ) {
        group.admins.high.push(
          target
        );
      }

      return reply(
        replyToken,
        "👑 ตั้งแอดมินสูงแล้ว"
      );
    }

    // ตั้งกลาง
    if (text.startsWith("ตั้งกลาง ")) {

      if (!isOwner && !isHigh)
        return reply(
          replyToken,
          "❌ เฉพาะแอดสูง"
        );

      const target =
        text.split(" ")[1];

      if (
        !group.admins.mid.includes(
          target
        )
      ) {
        group.admins.mid.push(
          target
        );
      }

      return reply(
        replyToken,
        "⭐ ตั้งแอดมินกลางแล้ว"
      );
    }

    // ตั้งล่าง
    if (text.startsWith("ตั้งล่าง ")) {

      if (
        !isOwner &&
        !isHigh &&
        !isMid
      )
        return reply(
          replyToken,
          "❌ ไม่มีสิทธิ์"
        );

      const target =
        text.split(" ")[1];

      if (
        !group.admins.low.includes(
          target
        )
      ) {
        group.admins.low.push(
          target
        );
      }

      return reply(
        replyToken,
        "🔹 ตั้งแอดมินล่างแล้ว"
      );
    }

    // ลบแอดมิน
    if (
      text.startsWith(
        "ลบแอดมิน "
      )
    ) {

      if (!isOwner)
        return reply(
          replyToken,
          "❌ เฉพาะเจ้าของ"
        );

      const target =
        text.split(" ")[1];

      group.admins.high =
        group.admins.high.filter(
          x => x !== target
        );

      group.admins.mid =
        group.admins.mid.filter(
          x => x !== target
        );

      group.admins.low =
        group.admins.low.filter(
          x => x !== target
        );

      return reply(
        replyToken,
        "🗑️ ลบแอดมินแล้ว"
      );
    }

    // รายชื่อแอดมิน
    if (
      text ===
      "รายชื่อแอดมิน"
    ) {

      return reply(
        replyToken,
`👑 สูง
${group.admins.high.join("\n") || "-"}

⭐ กลาง
${group.admins.mid.join("\n") || "-"}

🔹 ล่าง
${group.admins.low.join("\n") || "-"}`
      );
    }

    // เพิ่มดำ
    if (
      text.startsWith(
        "เพิ่มดำ "
      )
    ) {

      const target =
        text.split(" ")[1];

      if (
        !group.blacklist.includes(
          target
        )
      ) {
        group.blacklist.push(
          target
        );
      }

      return reply(
        replyToken,
        "🚫 เพิ่มบัญชีดำแล้ว"
      );
    }

    // ลบดำ
    if (
      text.startsWith(
        "ลบดำ "
      )
    ) {

      const target =
        text.split(" ")[1];

      group.blacklist =
        group.blacklist.filter(
          x => x !== target
        );

      return reply(
        replyToken,
        "✅ ลบบัญชีดำแล้ว"
      );
    }

    // รายชื่อดำ
    if (text === "รายชื่อดำ") {

      return reply(
        replyToken,
        group.blacklist.join("\n") ||
        "ไม่มีบัญชีดำ"
      );
    }
  }

  res.sendStatus(200);
});

async function reply(
  replyToken,
  text
) {
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
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type":
          "application/json"
      }
    }
  );
}

app.listen(PORT, () => {
  console.log(
    "🔥 BOT ONLINE"
  );
});