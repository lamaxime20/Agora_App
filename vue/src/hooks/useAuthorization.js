import { useContext } from 'react';
import { AuthorizationContext } from '../context/AuthorizationContext';

export function useAuthorization() {
    return useContext(AuthorizationContext);
}
