import * as moment from "moment";

/** The default format string we use for moment time stamps */
export const DEFAULT_MOMENT_FORMAT = "YYYY.MM.DD.HH.mm.ss.SSS";

/**
 * Returns a string formatted with a time via moment
 * @param {number} [epoch] optional epoch to init time to
 * @returns {string} time formatted to a string
 */
export function momentString(epoch?: number): string {
    return moment(epoch).format(DEFAULT_MOMENT_FORMAT);
}

/**
 * Takes a string that was made via momentString and transforms it back to an epoch
 * @param {string} str a string formatted from momentString
 * @returns {number} the epoch that was used to create that moment string
 */
export function stringToMoment(str: string): moment.Moment {
    return moment(str, DEFAULT_MOMENT_FORMAT);
}
