const express = require("express");
const axios = require("axios");
const moment = require("moment-timezone");

const app = express();

const port = process.env.PORT || 8080;

moment.tz.setDefault("Asia/Kolkata");

const getLastBrokenStreak = (activationDates) => {
  console.log("add datys ===>", activationDates);
  let lastBrokenStreak;
  const allDays = activationDates?.map((date) => {
    return moment(date);
  });
  const uniqueDays = [...new Set(allDays)];

  console.log("==>", uniqueDays);

  const lastCaseActivatedDay = allDays.at(-1);

  console.log("last ==>", lastCaseActivatedDay);
  for (let i = 1; i < uniqueDays.length; i++) {
    const dayDiff = moment(uniqueDays[i]).diff(uniqueDays[i - 1], "day");
    if (dayDiff > 2) {
      lastBrokenStreak = moment(uniqueDays[i - 1]).add(2, "day");
    }
  }

  console.log(
    "here is the data ===>",
    moment().diff(lastCaseActivatedDay, "day")
  );

  if (moment().diff(moment(lastCaseActivatedDay), "day") >= 2) {
    lastBrokenStreak = moment(lastCaseActivatedDay).add(2, "day");
  }

  console.log("here is the last broken streak ===>", lastBrokenStreak);
  return lastBrokenStreak;
};

const calculateUniqueStreak = (activationDates) => {
  if (activationDates.length === 0) {
    return 0;
  }

  const todayDate = moment();
  let latestStreakBroken;

  const allDays = activationDates?.map((date) => {
    return moment(date);
  });
  const lastCaseActivatedDay = allDays.at(-1);
  const uniqueDays = [...new Set(allDays)];

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

  const allDays = activationDates?.map((date) => {
    return moment(date);
  });

  const lastCaseActivatedDay = allDays.at(-1);

  if (moment().diff(lastCaseActivatedDay, "day") >= 2) {
    return true;
  }

  return false;
};

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
    const clientId = card.client_fk;
    if (clientId in clientMap) {
      clientMap[clientId].push(card);
    } else {
      clientMap[clientId] = [card];
    }
  }

  for (const [clientId, data] of Object.entries(clientMap)) {
    if (clientId == "1549") {
      console.log("here we have data ---", data);
      const obj = {
        streak: calculateUniqueStreak(
          data?.map((elem) => moment(elem.created_at))
        ),
        lastBrokenStreak: getLastBrokenStreak(
          data?.map((elem) => moment(elem.created_at))
        )?.toLocaleString(),
        isStreakBroken: isStreakBroken(
          data?.map((elem) => moment(elem.created_at))
        ),
      };

      console.log(obj);
      streakMap[clientId] = obj;
    }
  }

  res.send(streakMap);
});

app.listen(port, () => {
  console.log("server is listening on port");
});
