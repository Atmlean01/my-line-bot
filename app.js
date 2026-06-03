const express = require("express");
const axios = require("axios");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static("public"));

const TOKEN = process.env.CHANNEL_ACCESS_TOKEN;
const PORT = process.env.PORT || 3000;

// =====================
// DATABASE
// =====================

let groups = {};

try {
  groups = JSON.parse(
    fs.readFileSync("groups.json")
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

    saveData();
  }

  return groups[id];
}
// =====================
// REPLY TEXT
// =====================

async function reply(replyToken, text) {
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
        "Content-Type": "application/json"
      }
    }
  );
}

// =====================
// FLEX MENU
// =====================

async function replyFlex(replyToken) {

  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken,

      messages: [
        {
          type: "flex",
          altText: "ATM LEAN BOT",

          contents: {
            type: "bubble",

            hero: {
              type: "image",
              url: "https://military-yellow-rxlrlgrd.edgeone.app/DF7357E4-7D20-42B8-86F7-1F46613A1302.png",
              size: "full",
              aspectMode: "cover",
              aspectRatio: "20:13"
            },

            body: {
              type: "box",
              layout: "vertical",

              backgroundColor: "#12001d",

              contents: [

                {
                  type: "text",
                  text: "ATM LEAN BOT",
                  weight: "bold",
                  size: "xl",
                  color: "#CC00FF"
                },

                {
                  type: "text",
                  text: "OWNER : Atm Lean",
                  size: "sm",
                  color: "#66FF66"
                },

                {
                  type: "separator",
                  margin: "md"
                },

                {
                  type: "text",
                  text: "📊 สถานะ",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "👑 เช็คแอด",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "🛡️ เปิด/ปิดกันลิงก์",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "👋 เปิด/ปิดต้อนรับ",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "⭐ รายชื่อแอดมิน",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "🚫 เพิ่มดำ",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "🚫 ลบดำ",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "🚫 รายชื่อดำ",
                  color: "#FFFFFF"
                },

                {
                  type: "text",
                  text: "🔒 ล็อกกลุ่ม",
                  color: "#FFFFFF"
                }

              ]
            }
          }
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

// =====================
// WEBHOOK
// =====================

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

    const userId =
      e.source.userId;

    if (!groupId) continue;

    const group =
      getGroup(groupId);

    if (!group.owner) {

      group.owner = userId;

      saveData();
    }

    const isOwner =
      userId === group.owner;

    const isHigh =
      group.admins.high.includes(userId);

    const isMid =
      group.admins.mid.includes(userId);

    const isLow =
      group.admins.low.includes(userId);

    const isAdmin =
      isOwner ||
      isHigh ||
      isMid ||
      isLow;

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
      return replyFlex(replyToken);
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

// =====================
// สถานะ
// =====================

if (text === "สถานะ") {

  return reply(
    replyToken,
    JSON.stringify(group, null, 2)
  );
}

// =====================
// เปิดกันลิงก์
// =====================

if (text === "เปิดกันลิงก์") {

  if (!isOwner && !isHigh) {

    return reply(
      replyToken,
      "❌ เฉพาะเจ้าของ/แอดมินสูง"
    );
  }

  group.antiLink = true;

  saveData();

  return reply(
    replyToken,
    "🔒 เปิดกันลิงก์แล้ว"
  );
}

// =====================
// ปิดกันลิงก์
// =====================

if (text === "ปิดกันลิงก์") {

  if (!isOwner && !isHigh) {

    return reply(
      replyToken,
      "❌ เฉพาะเจ้าของ/แอดมินสูง"
    );
  }

  group.antiLink = false;

  saveData();

  return reply(
    replyToken,
    "🔓 ปิดกันลิงก์แล้ว"
  );
}

// =====================
// เปิดต้อนรับ
// =====================

if (text === "เปิดต้อนรับ") {

  group.welcome = true;

  saveData();

  return reply(
    replyToken,
    "👋 เปิดต้อนรับแล้ว"
  );
}

// =====================
// ปิดต้อนรับ
// =====================

if (text === "ปิดต้อนรับ") {

  group.welcome = false;

  saveData();

  return reply(
    replyToken,
    "👋 ปิดต้อนรับแล้ว"
  );
}

// =====================
// ล็อกกลุ่ม
// =====================

if (text === "ล็อกกลุ่ม") {

  group.lock = true;

  saveData();

  return reply(
    replyToken,
    "🔒 ล็อกกลุ่มแล้ว"
  );
}

// =====================
// ปลดล็อกกลุ่ม
// =====================

if (text === "ปลดล็อกกลุ่ม") {

  group.lock = false;

  saveData();

  return reply(
    replyToken,
    "🔓 ปลดล็อกกลุ่มแล้ว"
  );
}

// =====================
// รายชื่อแอดมิน
// =====================

if (text === "รายชื่อแอดมิน") {

  return reply(
    replyToken,

`👑 แอดมินสูง
${group.admins.high.join("\n") || "-"}

⭐ แอดมินกลาง
${group.admins.mid.join("\n") || "-"}

🔹 แอดมินล่าง
${group.admins.low.join("\n") || "-"}`
  );
}

// =====================
// ตั้งสูง
// =====================

if (text.startsWith("ตั้งสูง ")) {

  if (!isOwner) {

    return reply(
      replyToken,
      "❌ เฉพาะเจ้าของ"
    );
  }

  const target =
    text.split(" ")[1];

  if (
    !group.admins.high.includes(target)
  ) {

    group.admins.high.push(target);

    saveData();
  }

  return reply(
    replyToken,
    "👑 ตั้งแอดมินสูงแล้ว"
  );
}

// =====================
// ตั้งกลาง
// =====================

if (text.startsWith("ตั้งกลาง ")) {

  if (!isOwner && !isHigh) {

    return reply(
      replyToken,
      "❌ เฉพาะแอดสูง"
    );
  }

  const target =
    text.split(" ")[1];

  if (
    !group.admins.mid.includes(target)
  ) {

    group.admins.mid.push(target);

    saveData();
  }

  return reply(
    replyToken,
    "⭐ ตั้งแอดมินกลางแล้ว"
  );
}

// =====================
// ตั้งล่าง
// =====================

if (text.startsWith("ตั้งล่าง ")) {

  if (
    !isOwner &&
    !isHigh &&
    !isMid
  ) {

    return reply(
      replyToken,
      "❌ ไม่มีสิทธิ์"
    );
  }

  const target =
    text.split(" ")[1];

  if (
    !group.admins.low.includes(target)
  ) {

    group.admins.low.push(target);

    saveData();
  }

  return reply(
    replyToken,
    "🔹 ตั้งแอดมินล่างแล้ว"
  );
}

// =====================
// ลบแอดมิน
// =====================

if (text.startsWith("ลบแอดมิน ")) {

  if (!isOwner) {

    return reply(
      replyToken,
      "❌ เฉพาะเจ้าของ"
    );
  }

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

  saveData();

  return reply(
    replyToken,
    "🗑️ ลบแอดมินแล้ว"
  );
}

// =====================
// เพิ่มดำ
// =====================

if (text.startsWith("เพิ่มดำ ")) {

  if (!isAdmin) {

    return reply(
      replyToken,
      "❌ เฉพาะแอดมิน"
    );
  }

  const target =
    text.split(" ")[1];

  if (
    !group.blacklist.includes(target)
  ) {

    group.blacklist.push(target);

    saveData();
  }

  return reply(
    replyToken,
    "🚫 เพิ่มบัญชีดำแล้ว"
  );
}

// =====================
// ลบดำ
// =====================

if (text.startsWith("ลบดำ ")) {

  if (!isAdmin) {

    return reply(
      replyToken,
      "❌ เฉพาะแอดมิน"
    );
  }

  const target =
    text.split(" ")[1];

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

// =====================
// รายชื่อดำ
// =====================

if (text === "รายชื่อดำ") {

return reply(
  replyToken,
  `🚫 BLACKLIST

${group.blacklist.join("\n") || "ไม่มีบัญชีดำ"}`
);
}

  res.sendStatus(200);

});

// =====================
// START SERVER
// =====================

app.listen(PORT, () => {

  console.log(
    "🔥 ATM LEAN BOT ONLINE"
  );

});