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
const profileCache = {};
const groupNameCache = {};
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

// ======================
// GET PROFILE
// ======================

async function getProfile(userId) {

  if (profileCache[userId]) {
    return profileCache[userId];
  }

  try {

    const res = await axios.get(
      `https://api.line.me/v2/bot/profile/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    profileCache[userId] =
      res.data.displayName;

    return res.data.displayName;

  } catch {

    return userId;

  }
  
} 
  
async function getGroupName(groupId) {

  if (groupNameCache[groupId]) {
    return groupNameCache[groupId];
  }

  try {

    const res = await axios.get(
      `https://api.line.me/v2/bot/group/${groupId}/summary`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    groupNameCache[groupId] =
      res.data.groupName;

    return res.data.groupName;

  } catch {

    return "ไม่ทราบชื่อกลุ่ม";

  }

}
function getGroup(groupId) {

  if (!groups[groupId]) {

    groups[groupId] = {
  creator: "Ucb2d323e3d729a46f20007a2553b49b3",
  owners: [
    "U8c38960ba9db492c491740c19fa361e5"
  ],
  buyers: [],
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
async function replyFlex(replyToken, flex) {

  try {

    await axios.post(
      "https://api.line.me/v2/bot/message/reply",
      {
        replyToken,
        messages: [
          {
            type: "flex",
            altText: "ATM API BOT",
            contents: flex
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

  } catch (err) {

    console.log(
      "FLEX ERROR",
      err.response?.data || err.message
    );

  }
async function pushMessage(to, text) {
  try {
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to,
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
  } catch (err) {
    console.log(err.response?.data || err.message);
  }
}

// ======================
// WEBHOOK
// ======================

app.post("/webhook", async (req, res) => {
const startTime = Date.now();

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
      
      console.log(
  "MESSAGE:",
  JSON.stringify(event.message, null, 2)
);

    const replyToken =
      event.replyToken;

    const groupId =
      event.source.groupId ||
      event.source.roomId;

    const userId =
      event.source.userId;
      console.log("USER ID =", userId);
      const mentionees =
  event.message.mention?.mentionees || [];

// หา USER ID

if (text === "myid") {

  return reply(

    replyToken,

    `USER ID : ${userId}`

  );

}

console.log(
  "MENTIONS:",
  JSON.stringify(mentionees, null, 2)
);

    if (!groupId) continue;

    const group =
      getGroup(groupId);

    const MASTER_ID =
"Ucb2d323e3d729a46f20007a2553b49b3";

const isCreator =
userId === MASTER_ID;

const isOwner =
isCreator ||
group.owners.includes(userId);
console.log("USER ID =", userId);
console.log("MASTER =", MASTER_ID);
console.log("OWNERS =", group.owners);
console.log("IS OWNER =", isOwner);
const isBuyer =
group.buyers.includes(userId);

const isAdmin =
group.admins.includes(userId);

const isStaff =
isCreator ||
isOwner ||
isBuyer ||
isAdmin;

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

👑 Creator : ATM.API BOT
🟢 Status : ONLINE

📊 Staff System
👑 Owner : ${group.owners.length}
💎 Buyer : ${group.buyers.length}
🛡 Admin : ${group.admins.length}`
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
if (
  text.startsWith("ตั้งประกาศ ")
) {

  if (!isOwner) {
    return reply(
      replyToken,
      "❌ เฉพาะ OWNER เท่านั้น"
    );
  }

  const msg = text.replace(
    "ตั้งประกาศ ",
    ""
  );

  let total = 0;

  for (const gid in groups) {
    await pushMessage(
      gid,
      `📢 ประกาศ ATM LEAN\n\n${msg}`
    );
    total++;
  }

  return reply(
    replyToken,
    `✅ ส่งประกาศแล้ว ${total} ห้อง`
  );
}

if (
  text.startsWith("ประกาศด่วน ")
) {

  if (!isOwner) {
    return reply(
      replyToken,
      "❌ เฉพาะ OWNER เท่านั้น"
    );
  }

  const msg = text.replace(
    "ประกาศด่วน ",
    ""
  );

  let urgentTotal = 0;

  for (const gid in groups) {
    await pushMessage(
      gid,
      `🚨 ประกาศด่วน ATM LEAN 🚨\n\n${msg}`
    );
    urgentTotal++;
  }

  return reply(
    replyToken,
    `✅ ส่งประกาศด่วนแล้ว ${urgentTotal} ห้อง`
  );
}

    // ======================
    // เช็คแอด
    // ======================

    if (text == "เช็คแอด") {

if (!isOwner) {

  return reply(

    replyToken,

    "❌ เฉพาะ Owner เท่านั้น"

  );

}

const creatorName =

group.creator

? await getProfile(group.creator)

: "-";

const ownerNames =
group.owners.length
? await Promise.all(
group.owners.map(
id => getProfile(id)
)
)
: [];

const buyerNames =
group.buyers.length
? await Promise.all(
group.buyers.map(
id => getProfile(id)
)
)
: [];

const adminNames =
group.admins.length
? await Promise.all(
group.admins.map(
id => getProfile(id)
)
)
: [];

return reply(
replyToken,
`👑 CREATOR
${creatorName}

👑 OWNER
${ownerNames.length
? ownerNames.join("\n")
: "ไม่มี Owner"}

💎 BUYER
${buyerNames.length
? buyerNames.join("\n")
: "ไม่มี Buyer"}

⭐ ADMINS
${adminNames.length
? adminNames.join("\n")
: "ไม่มี Admin"}`
);

}
// ====================
// ข้อมูลกลุ่ม
// ====================

if (text === "ข้อมูลกลุ่ม") {

if (!isOwner) {
  return reply(
    replyToken,
    "❌ เฉพาะ Owner เท่านั้น"
  );
}

const creatorName =
group.creator
? await getProfile(group.creator)
: "-";
const groupName =
await getGroupName(groupId);

const flexData = {
  type: "bubble",

  hero: {
    type: "image",
    url: "https://military-yellow-rxlrlgrd.edgeone.app/DF7357E4-7D20-42B8-86F7-1F46613A1302.png",
    size: "full",
    aspectRatio: "16:9",
    aspectMode: "cover"
  },

  body: {
    type: "box",
    layout: "vertical",
    backgroundColor: "#12001F",
    contents: [

      {
  type: "text",
  text: "✦ ATM LEAN SYSTEM ✦",
  weight: "bold",
  size: "xl",
  color: "#FF66FF",
  align: "center"
},
{
  type: "text",
  text: "OWNER CONTROL PANEL",
  size: "xs",
  color: "#66FFFF",
  align: "center"
},
{
  type: "text",
  text: `⚡ Uptime : ${process.uptime().toFixed(0)} วินาที`,
  color: "#00FFFF",
  size: "sm",
  align: "center",
  margin: "sm"
},
      {
        type: "text",
        text: groupName,
        weight: "bold",
        size: "xl",
        color: "#FFFFFF",
        align: "center",
        margin: "md"
      },

      {
        type: "separator",
        margin: "lg",
        color: "#A855F7"
      },

      {
        type: "text",
        text: `👑 Creator : ${creatorName}`,
        color: "#FFCC00",
        margin: "md",
        weight: "bold"
      },

      {
        type: "text",
        text: `👑 Owner : ${group.owners.length} คน`,
        color: "#FFD700",
        weight: "bold"
      },

      {
        type: "text",
        text: `⭐ Admin : ${group.admins.length}`,
        color: "#00FFFF",
        weight: "bold"
      },

      {
        type: "text",
        text: `💎 Buyer : ${group.buyers.length}`,
        color: "#66CCFF",
        weight: "bold"
      },

      {
        type: "text",
        text: `🚫 Blacklist : ${group.blacklist.length}`,
        color: "#FF6666",
        weight: "bold"
      },

      {
        type: "separator",
        margin: "lg",
        color: "#A855F7"
      },

      {
        type: "text",
        text: `👥 สมาชิกทั้งหมด : ${           group.owners.length +           group.admins.length +           group.buyers.length         }`,
        color: "#00FF99",
        weight: "bold",
        margin: "md",
        size: "md"
      }
    ]
  },

  footer: {
    type: "box",
    layout: "vertical",
    spacing: "sm",
    backgroundColor: "#0A0015",
    contents: [

      {
        type: "button",
        style: "primary",
        color: "#A855F7",
        action: {
          type: "message",
          label: "👑 เช็คแอด",
          text: "เช็คแอด"
        }
      },

      {
        type: "button",
        style: "primary",
        color: "#9333EA",
        action: {
          type: "message",
          label: "🏠 รายชื่อห้อง",
          text: "รายชื่อห้อง"
        }
      },

      {
        type: "button",
        style: "primary",
        color: "#7C3AED",
        action: {
          type: "message",
          label: "📦 จำนวนห้อง",
          text: "จำนวนห้อง"
          }
      },
      
          {
  type: "button",
  style: "primary",
  color: "#00CC99",
  action: {
    type: "message",
    label: "🔄 รีเฟรช",
    text: "ข้อมูลกลุ่ม"
      } 
    }
  ]
}
};

return replyFlex(
  replyToken,
  flexData
);

}
if (text === "จำนวนห้อง") {
if (!isOwner) {
  return reply(
    replyToken,
    "❌ เฉพาะ Owner เท่านั้น"
  );
}
const totalGroups =
Object.keys(groups).length;

let ownerCount = 0;
let adminCount = 0;
let buyerCount = 0;

for (const id in groups) {

ownerCount +=
groups[id].owners.length;

adminCount +=
groups[id].admins.length;

buyerCount +=
groups[id].buyers.length;

}

return reply(
replyToken,
`🏠 BOT STATUS

📦 กลุ่มทั้งหมด : ${totalGroups}

👑 Owner : ${ownerCount}

⭐ Admin : ${adminCount}

💎 Buyer : ${buyerCount}`
);

}
if (text === "รายชื่อห้อง") {
if (!isOwner) {
  return reply(
    replyToken,
    "❌ เฉพาะ Owner เท่านั้น"
  );
}
let roomList = [];
let no = 1;

for (const groupId in groups) {

const groupName =
await getGroupName(groupId);

roomList.push(
`${no}. ${groupName}`
);

no++;

}

return reply(
replyToken,
`🏠 ห้องทั้งหมด ${roomList.length} ห้อง

${roomList.join("\n")}`
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

      if (
!mentionees.length
) {
return reply(
replyToken,
"❌ กรุณาแท็กสมาชิก"
);
}

const target = mentionees[0].userId;

const name = await getProfile(target);

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
`✅ เพิ่มแอดมินแล้ว

${name}`
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

      if (!mentionees.length) {
return reply(
replyToken,
"❌ กรุณาแท็กสมาชิก"
);
}

const target =
mentionees[0].userId;

const name =
await getProfile(target);

      group.admins =
        group.admins.filter(
          x => x !== target
        );

      saveData();

      return reply(
replyToken,
`🗑️ ลบแอดมินแล้ว

${name}`
);

    }

    // ======================
    // รายชื่อแอดมิน
    // ======================

    if (
  text ===
  "รายชื่อแอดมิน"
) {

const adminNames =
group.admins.length
? await Promise.all(
group.admins.map(
id => getProfile(id)
)
)
: [];

return reply(
replyToken,

`⭐ ADMIN LIST

${adminNames.length
? adminNames.join("\n")
: "ไม่มี Admin"}`
);

}
    // ======================
    // เพิ่มดำ
    // ======================

    if (text.startsWith("เพิ่มดำ ")) {

      if (!isStaff) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      if (!mentionees.length) {
return reply(
replyToken,
"❌ กรุณาแท็กสมาชิก"
);
}

const target =
mentionees[0].userId;

const name =
await getProfile(target);

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
`⛔ เพิ่มบัญชีดำแล้ว

${name}`
);

    }

    // ======================
    // ลบดำ
    // ======================

    if (text.startsWith("ลบดำ ")) {

      if (!isStaff) {
        return reply(
          replyToken,
          "❌ เฉพาะแอดมิน"
        );
      }

      if (!mentionees.length) {
return reply(
replyToken,
"❌ กรุณาแท็กสมาชิก"
);
}

const target =
mentionees[0].userId;

const name =
await getProfile(target);

      group.blacklist =
        group.blacklist.filter(
          x => x !== target
        );

      saveData();

      return reply(
replyToken,
`✅ ลบบัญชีดำแล้ว

${name}`
);

    }

    // ======================
    // เช็คดำ
    // ======================

    if (
text == "เช็คดำ" ||
text == "รายชื่อดำ"
) {

const blackNames =
group.blacklist.length
? await Promise.all(
group.blacklist.map(
id => getProfile(id)
)
)
: [];

return reply(
replyToken,

`🚫 BLACKLIST

${blackNames.length
? blackNames.join("\n")
: "ไม่มีบัญชีดำ"}`
);

}
    // ======================
    // ล้างดำ
    // ======================

    if (text === "ล้างดำ") {

      if (!isStaff) {

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

      if (!isStaff) {

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

      if (!isStaff) {

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

      if (!isStaff) {
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

      if (!isStaff) {
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

      if (!isStaff) {
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

      if (!isStaff) {
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

      if (!isStaff) {
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

      if (!isStaff) {
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

      if (!isStaff) {
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

      if (!isStaff) {
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
    
  console.log(`⚡ Response Time: ${Date.now() - startTime} ms`);
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