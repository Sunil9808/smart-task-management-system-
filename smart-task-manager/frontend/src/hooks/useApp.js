import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';
export const useAuth = () => useContext(AuthContext);
export const useToast = () => useContext(ToastContext);
