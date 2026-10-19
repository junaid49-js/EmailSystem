import nodemailer from 'nodemailer';

let transporterInstance = null;
let isEthereal = false;

function buildTransportConfig() {
    const config = {};

    if (process.env.SMTP_SERVICE) {
        config.service = process.env.SMTP_SERVICE;
    } else {
        config.host = process.env.SMTP_HOST || 'smtp.ethereal.email';
        config.port = Number(process.env.SMTP_PORT) || 587;
        config.secure = process.env.SMTP_SECURE === 'true' || config.port === 465;
    }

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        config.auth = {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        };
    }

    if (process.env.SMTP_POOL === 'true') {
        config.pool = true;
        config.maxConnections = Number(process.env.SMTP_MAX_CONNECTIONS) || 5;
        config.maxMessages = Number(process.env.SMTP_MAX_MESSAGES) || 100;
    }

    if (process.env.SMTP_RATE_LIMIT) {
        config.rateLimit = Number(process.env.SMTP_RATE_LIMIT);
        config.rateDelta = Number(process.env.SMTP_RATE_DELTA) || 1000;
    }

    config.connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT) || 10000;
    config.greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT) || 10000;
    config.socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT) || 15000;

    config.tls = {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
        ...(process.env.SMTP_CIPHERS ? { ciphers: process.env.SMTP_CIPHERS } : {})
    };

    if (process.env.SMTP_REQUIRE_TLS === 'true') {
        config.requireTLS = true;
    }

    if (process.env.SMTP_DEBUG === 'true') {
        config.debug = true;
    }
    if (process.env.SMTP_LOGGER === 'true') {
        config.logger = true;
    }

    return config;
}

export async function getTransporter() {
    if (transporterInstance) {
        return transporterInstance;
    }

    const transportConfig = buildTransportConfig();

    if (transportConfig.auth?.user && transportConfig.auth?.pass) {
        transporterInstance = nodemailer.createTransport(transportConfig);
        isEthereal = false;
        return transporterInstance;
    }

    console.log('ℹ️ No SMTP credentials provided. Creating an Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();

    transporterInstance = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        },
        connectionTimeout: transportConfig.connectionTimeout,
        greetingTimeout: transportConfig.greetingTimeout,
        socketTimeout: transportConfig.socketTimeout
    });

    isEthereal = true;
    console.log(`✅ Ethereal test account active: ${testAccount.user}`);
    return transporterInstance;
}

export async function verifyTransporter() {
    try {
        const transporter = await getTransporter();
        await transporter.verify();
        return {
            success: true,
            message: 'SMTP server is ready to take messages',
            isEthereal
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            isEthereal
        };
    }
}

export function getPreviewUrl(info) {
    return nodemailer.getTestMessageUrl(info);
}

export function getDefaultFrom() {
    if (process.env.SMTP_FROM_NAME && process.env.SMTP_FROM_EMAIL) {
        return `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`;
    }
    return process.env.EMAIL_FROM || '"Email System" <no-reply@emailsystem.com>';
}

export function getDefaultReplyTo() {
    return process.env.SMTP_REPLY_TO || undefined;
}

export default {
    getTransporter,
    verifyTransporter,
    getPreviewUrl,
    getDefaultFrom,
    getDefaultReplyTo
};
