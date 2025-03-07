/**
 * Release builder logger.
 *
 * @author jillurquddus
 * @since  0.0.1
 */

import winston from 'winston';
import 'winston-daily-rotate-file'
const { combine, label, printf, timestamp } = winston.format;


const loggingFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level.toUpperCase()}: ${message}`;
});

const consoleTransport = new winston.transports.Console();

const fileRotateTransport = new winston.transports.DailyRotateFile({
    filename: 'logs/teddy-releaser-%DATE%.log', 
    datePattern: 'YYYY-MM-DD', 
    maxFiles: '14d', 
    maxSize: '10m'
});

const logger = winston.createLogger({
    level: 'info',
    defaultMeta: {
        service: 'teddy-releaser'
    }, 
    format: combine(
        label({ 
            label: 'Teddy Releaser' 
        }),
        timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        loggingFormat
    ),
    transports: [
        consoleTransport, 
        fileRotateTransport
    ]
});

export default logger;
