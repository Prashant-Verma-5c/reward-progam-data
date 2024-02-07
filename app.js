const express = require("express");
const axios = require("axios");
const moment = require("moment-timezone");

const app = express();

const PORT = 8000;

const getLastBrokenStreak = (activationDates) => {
  // console.log("add datys ===>", activationDates);
  let lastBrokenStreak;
  const days = activationDates?.map((ele) => ele.format("YYYY-MM-DD"));
  const uniqueDays = [...new Set(days)];

  // console.log("==>", uniqueDays);

  const lastCaseActivatedDay = activationDates.at(-1);

  // console.log("last ==>", lastCaseActivatedDay);
  for (let i = 1; i < uniqueDays.length; i++) {
    const dayDiff = moment(uniqueDays[i]).diff(uniqueDays[i - 1], "day");
    if (dayDiff > 2) {
      lastBrokenStreak = moment(uniqueDays[i - 1]).add(2, "day");
    }
  }

  // console.log(
  //   "here is the data ===>",
  //   moment().diff(lastCaseActivatedDay, "day")
  // );

  if (moment().diff(moment(lastCaseActivatedDay), "day") >= 2) {
    lastBrokenStreak = moment(lastCaseActivatedDay).add(2, "day");
  }

  // console.log("here is the last broken streak ===>", lastBrokenStreak);
  return lastBrokenStreak;
};

const calculateUniqueStreak = (activationDates) => {
  if (activationDates.length === 0) {
    return 0;
  }

  let latestStreakBroken;
  const todayDate = moment().tz("Asia/KolKata");
  // console.log({ todayDate });

  const lastCaseActivatedDay = activationDates.at(-1);
  // console.log({
  //   lastCaseActivatedDay: lastCaseActivatedDay,
  // });
  const days = activationDates?.map((ele) => ele.format("YYYY-MM-DD"));
  const uniqueDays = [...new Set(days)];
  // console.log({ uniqueDays });
  let currentStreak = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    const dayDiff = moment(uniqueDays[i]).diff(uniqueDays[i - 1], "day");
    if ([0, 1, 2].includes(dayDiff)) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  }

  if (
    moment(todayDate).isSame(lastCaseActivatedDay, "day") &&
    currentStreak == 0
  ) {
    currentStreak = 1;
  }

  if (moment(todayDate).diff(lastCaseActivatedDay, "day") >= 2) {
    latestStreakBroken = moment();
    currentStreak = 0;
  }

  return currentStreak;
};

const isStreakBroken = (activationDates) => {
  if (activationDates?.length === 0) {
    return true;
  }

  const lastCaseActivatedDay = activationDates.at(-1);

  if (moment().diff(lastCaseActivatedDay, "day") >= 2) {
    return true;
  }

  return false;
};

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/get-client-streak", async (req, res) => {
  const response = await axios.get(
    "https://answermagic.5cn.co.in/api/v1/db/data/v1/p7ta4753b4qod00/ScratchCardLogs?limit=200000",
    {
      headers: { "xc-token": "3qGWPbakAYq1BntlK0Upd9dw_I3Tsn86eRgwfCQN" },
    }
  );

  const allCards = response.data.list;

  const clientMap = {};
  const streakMap = {};
  for (let card of allCards) {
    const clientId = card?.client_fk;
    if (!clientId) {
      continue;
    }
    if (clientId in clientMap) {
      clientMap[clientId].push(card);
    } else {
      clientMap[clientId] = [card];
    }
  }
  // console.dir({ clientMap }, { depth: null });

  for (const [clientId, data] of Object.entries(clientMap)) {
    // console.log("here we have data ---", data);
    const obj = {
      streak: calculateUniqueStreak(
        data?.map((elem) => moment(elem.created_at).tz("Europe/London"))
      ),
      lastBrokenStreak: getLastBrokenStreak(
        data?.map((elem) => moment(elem.created_at).tz("Europe/London"))
      )?.toLocaleString(),
      isStreakBroken: isStreakBroken(
        data?.map((elem) => moment(elem.created_at).tz("Europe/London"))
      ),
    };

    // console.log(obj);
    streakMap[clientId] = obj;
  }

  res.send(streakMap);
});

app.listen(PORT, () => {
  console.log("server is listening on port");
});
