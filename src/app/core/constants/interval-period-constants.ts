const intervalPeriodConstants = {
  getLockUnlockStatusPeriod: 3000, // interval in ms
  getLightOnOffStatusPeriod: 3000, // interval in ms
  cancelRidePeriod: 2, // interval in minutes
  timeBeforeBookingRide: 120, // 120 seconds, interval in seconds  
  checkingRideStatusIntervalInRideDetails: 5 * 1000, // 10 seconds, which again converted into ms, interval in ms
  defaultLockUnlockTimePeriod: 90, // interval in seconds
  currentLocationUpdateInterval: 10 * 1000, // 10 seconds * 1000 ms
};

export default intervalPeriodConstants;