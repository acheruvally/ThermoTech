CREATE TABLE `solarheaterdata` (
  `SensorID` varchar(255) NOT NULL,
  `CreatedAt` timestamp NOT NULL,
  `MeasuredAt` timestamp NULL DEFAULT NULL,
  `FlowMeter` double DEFAULT NULL,
  `Temperature` double DEFAULT NULL,
  `TDS` double DEFAULT NULL,
  PRIMARY KEY (`SensorID`,`CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;