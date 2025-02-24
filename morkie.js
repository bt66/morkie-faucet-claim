require('dotenv').config()
const axios = require('axios')
const cron = require("node-cron");

const notifyToDiscord = async (
    webhookUrl,
    title = "",
    description = "",
    color = 3447003, // Corrected: Use decimal or hex format (0x3498db = 3447003)
    fields = [],
    footer = ""
    ) => {
    try {
        const res = await axios.post(webhookUrl, {
        embeds: [
            {
            title: title,
            description: description,
            color: color, // Ensure color is a valid number
            fields: fields,
            footer: footer ? { text: footer } : undefined, // Corrected: Footer should be an object
            },
        ],
        });

        console.log("✅ Embed message sent successfully:", res.data);
        return res.data;
    } catch (error) {
        console.error("❌ Error sending webhook:", error.response?.data || error.message);
        return null;
    }
};
  

const morkieFaucet = async (address) => {
    try {
      const response = await axios.post(
        "https://faucet.morkie.xyz/api/monad",
        { address },
        {
          headers: {
            Accept: "*/*",
            "Content-Type": "application/json",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
          },
        }
      );
  
      console.log(`✅ Successfully requested faucet for ${address}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error requesting faucet for ${address}:`, error.response?.data || error.message);
      return null; // Return null so main() can handle it
    }
};


const main = async () => {
    try {
      const addresses = JSON.parse(process.env.WALLETS || "[]");
  
      if (addresses.length === 0) {
        throw new Error("⚠️ Please provide addresses in the .env file under WALLETS");
      }
  
      for (const address of addresses) {
        console.log(`🚀 Requesting faucet for ${address}...`);
        const result = await morkieFaucet(address);
  
        if (!result) {
            console.error(`⚠️ Faucet request failed for ${address}`);
            await notifyToDiscord(
                process.env.DISCORD_WEBHOOK, 
                title=`🚨 Faucet request failed`, 
                description=`requested address : ${address}, please check server log.`
            );
        } else {
            await notifyToDiscord(
                process.env.DISCORD_WEBHOOK,
                title=`Claim result for address`,
                description=`error ${address} : ${result}`
            )
        }
      }
  
      console.log("🎉 All faucet requests completed.");
    } catch (error) {
      console.error("❌ Critical error in main:", error.message);
      await notifyToDiscord(process.env.DISCORD_WEBHOOK, title=`🔥 Critical Error: ${error.message}`);
    }
};  

main()
const task = () => {
  console.log(`✅ Running task at ${new Date().toLocaleString()}`);
  main()
};
  
// Schedule the task to run every 6 hours
cron.schedule("0 */6 * * *", task, {
  scheduled: true,
  timezone: "Asia/Jakarta", // Set your timezone if needed
});

console.log("⏳ Cronjob started. Task will run every 6 hours.");