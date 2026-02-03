import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export interface ConfiguracionGeneral {
    businessName: string;
    rnc?: string;
    telefono: string;
    direccion?: string;
    impuestoPorcentaje: number;
    propinaPorcentaje: number;
    moneda: string;
    logoUrl?: string;
}

const DEFAULT_CONFIG: ConfiguracionGeneral = {
    businessName: '',
    rnc: '',
    telefono: '',
    direccion: '',
    impuestoPorcentaje: 18,
    propinaPorcentaje: 10,
    moneda: 'RD$',
};

export function useConfiguracion() {
    const { user } = useAuth();
    const [config, setConfig] = useState<ConfiguracionGeneral>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.tenantId) {
            setLoading(false);
            return;
        }

        const configRef = doc(db, 'tenants', user.tenantId, 'config', 'general');

        // Suscripción en tiempo real
        const unsubscribe = onSnapshot(
            configRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setConfig(docSnap.data() as ConfiguracionGeneral);
                } else {
                    // Si no existe, usar configuración por defecto
                    setConfig(DEFAULT_CONFIG);
                }
                setLoading(false);
                setError(null);
            },
            (err) => {
                console.error('Error al cargar configuración:', err);
                setError('Error al cargar configuración');
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user?.tenantId]);

    const saveConfig = async (nuevaConfig: Partial<ConfiguracionGeneral>): Promise<void> => {
        console.log('saveConfig called with:', nuevaConfig)
        console.log('Current tenantId:', user?.tenantId)

        if (!user?.tenantId) {
            console.error('No tenantId found')
            throw new Error('Usuario no autenticado');
        }

        try {
            const configRef = doc(db, 'tenants', user.tenantId, 'config', 'general');
            const configActualizada = { ...config, ...nuevaConfig };

            console.log('Saving to Firestore:', configActualizada)
            await setDoc(configRef, configActualizada, { merge: true });
            console.log('Firestore save completed')

            // El estado se actualizará automáticamente por onSnapshot
        } catch (err) {
            console.error('Error al guardar configuración:', err);
            throw new Error('Error al guardar configuración');
        }
    };

    return {
        config,
        loading,
        error,
        saveConfig,
    };
}
