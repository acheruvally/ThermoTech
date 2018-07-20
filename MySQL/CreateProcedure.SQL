CREATE DEFINER=`root`@`localhost` PROCEDURE `AddSolarHeaterData`(
in _SensorID varchar(255),
in _MeasuredAt timestamp,
in _FlowMeter double, 
in _Temperature double )
BEGIN

insert into SolarHeaterData( SensorID , CreatedAt , MeasuredAt , FlowMeter , Temperature ) 
values (_SensorID , now() , _MeasuredAt , _FlowMeter , _Temperature );

END$$
DELIMITER ;

