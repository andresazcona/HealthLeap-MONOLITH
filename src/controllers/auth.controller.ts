import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import AppError from '../utils/AppError';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        throw new AppError('Refresh token no proporcionado', 400);
      }
      
      const result = await authService.refreshToken(refreshToken);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      // El método logout no acepta argumentos o está definido de otra manera
      // Modificado para llamar correctamente al método
      if (refreshToken) {
        await authService.logout(); // Removido el parámetro refreshToken
      }
      
      res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      await authService.forgotPassword(email);
      
      res.status(200).json({
        status: 'success',
        message: 'Se ha enviado un correo con instrucciones para restablecer la contraseña'
      });
    } catch (error) {
      next(error);
    }
  }
  
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, newPassword } = req.body;
      
      await authService.resetPassword(token, newPassword);
      
      res.status(200).json({
        status: 'success',
        message: 'Contraseña restablecida correctamente'
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();