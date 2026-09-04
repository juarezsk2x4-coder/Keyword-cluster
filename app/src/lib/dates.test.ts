import { describe, it, expect } from "vitest";
import { addDaysIso, dowForIso, getSundayOfWeek, getNextSunday, lastNDates } from "./dates";

// The whole suite runs with TZ=Asia/Tokyo (see vitest.config.ts) precisely
// because these helpers used to do their arithmetic in server-local time and
// read it back as UTC. Under that old implementation every assertion below
// shifted back by a day when the host was east of UTC — production on Vercel
// (UTC) hid it, and it silently made the home page render Sunday's skate plan
// on every day of the week for anyone developing east of Greenwich.
describe("date helpers are independent of the host timezone", () => {
  it("addDaysIso moves whole days without drifting", () => {
    expect(addDaysIso("2026-09-04", 1)).toBe("2026-09-05");
    expect(addDaysIso("2026-09-04", -1)).toBe("2026-09-03");
    expect(addDaysIso("2026-09-04", 0)).toBe("2026-09-04");
  });

  it("crosses month, year and leap-day boundaries", () => {
    expect(addDaysIso("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDaysIso("2026-09-01", -1)).toBe("2026-08-31");
    expect(addDaysIso("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysIso("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDaysIso("2028-02-28", 1)).toBe("2028-02-29"); // 2028 is a leap year
    expect(addDaysIso("2027-02-28", 1)).toBe("2027-03-01");
  });

  it("dowForIso reports the real weekday (0 = Sunday)", () => {
    expect(dowForIso("2026-09-06")).toBe(0); // Sunday
    expect(dowForIso("2026-09-04")).toBe(5); // Friday
    expect(dowForIso("2026-09-05")).toBe(6); // Saturday
  });

  it("getSundayOfWeek anchors to the Sunday on or before the date", () => {
    expect(getSundayOfWeek("2026-09-04")).toBe("2026-08-30");
    // A Sunday is its own week start — the case the old code got wrong first.
    expect(getSundayOfWeek("2026-09-06")).toBe("2026-09-06");
    expect(getSundayOfWeek("2026-09-12")).toBe("2026-09-06");
  });

  it("getNextSunday advances exactly one week", () => {
    expect(getNextSunday("2026-08-30")).toBe("2026-09-06");
  });

  it("lastNDates counts back from the end date, most recent first, inclusive", () => {
    expect(lastNDates("2026-09-04", 3)).toEqual(["2026-09-04", "2026-09-03", "2026-09-02"]);
    // The end date must be present: the old implementation dropped "today"
    // entirely east of UTC, so today's sleep log never drove any prediction.
    expect(lastNDates("2026-09-04", 1)).toEqual(["2026-09-04"]);
    expect(lastNDates("2026-09-01", 3)).toEqual(["2026-09-01", "2026-08-31", "2026-08-30"]);
  });

  it("a full week built from a Sunday anchor lands Sun..Sat in order", () => {
    const week = Array.from({ length: 7 }, (_, i) => addDaysIso("2026-08-30", i));
    expect(week).toEqual([
      "2026-08-30", "2026-08-31", "2026-09-01", "2026-09-02",
      "2026-09-03", "2026-09-04", "2026-09-05",
    ]);
    expect(week.map(dowForIso)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});
