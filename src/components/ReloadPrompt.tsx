import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from '@/components/ui/button'
import { RefreshCw, X, Sparkles } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r: ServiceWorkerRegistration | undefined) {
            console.log('SW Registered: ', r)
        },
        onRegisterError(error: any) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    React.useEffect(() => {
        if (needRefresh) {
            toast({
                title: 'Nueva versión disponible',
                description: 'Hay mejoras en el sistema. Haz clic para actualizar.',
                duration: 10000,
                action: (
                    <Button
                        size="sm"
                        onClick={() => updateServiceWorker(true)}
                        className="bg-primary text-primary-foreground font-bold shadow-lg"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        ACTUALIZAR
                    </Button>
                ),
            })
        }
    }, [needRefresh, updateServiceWorker])

    if (!offlineReady && !needRefresh) return null

    return (
        <div className="fixed bottom-6 right-6 z-[100] p-5 rounded-xl border-2 bg-background shadow-2xl max-w-[320px] animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 border-primary/20">
            <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                        <div className="mt-1 p-2 bg-primary/10 rounded-full">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-bold text-sm tracking-tight">
                                {offlineReady ? '🟢 Sistema Listo' : '🚀 Mejora Disponible'}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                {offlineReady
                                    ? 'La aplicación ya funciona sin internet.'
                                    : 'Nuevas correcciones y funciones han sido desplegadas.'}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-1 opacity-50 hover:opacity-100" onClick={close}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {needRefresh && (
                    <Button
                        size="lg"
                        onClick={() => updateServiceWorker(true)}
                        className="w-full mt-1 bg-primary text-primary-foreground font-bold hover:scale-[1.02] transition-transform shadow-md"
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        INSTALAR MEJORA
                    </Button>
                )}
            </div>
        </div>
    )
}

export default ReloadPrompt
