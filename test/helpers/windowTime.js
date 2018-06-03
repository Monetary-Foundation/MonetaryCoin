import { duration } from './increaseTime';

/**
   * Returns possible window timestamp for specific window
   * @param {number} startTime - timestamp of the distribution start
   * @param {number} windowNumber - Number of window, range: [0-lastWindow-1]
   * @param {number} windowLength - Window length in seconds
   * @returns {number} possible timestamp for window
   */
export function windowTimeStamp (startTime, windowNumber, windowLength) {
  return (startTime + duration.seconds(5) + windowNumber * windowLength);
}
