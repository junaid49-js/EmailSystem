import { AuthService } from '../services/auth.service.js';
import { ResponseFactory } from '../utils/responseFactory.js';

export async function adminSignup(req, res) {
    const { name, email, password } = req.body;
    const createdBy = req.admin ? req.admin.id : null;

    const result = await AuthService.registerAdmin({
        name,
        email,
        password,
        createdBy,
        ipAddress: req.ip
    });

    return ResponseFactory.created(res, 'Admin registered successfully.', result);
}

export async function login(req, res) {
    const { email, password } = req.body;

    const result = await AuthService.loginAdmin({
        email,
        password,
        ipAddress: req.ip
    });

    return ResponseFactory.success(res, 'Login successful.', result);
}

export async function getProfile(req, res) {
    return ResponseFactory.success(res, 'Profile retrieved successfully.', req.admin);
}

export default {
    adminSignup,
    login,
    getProfile
};
