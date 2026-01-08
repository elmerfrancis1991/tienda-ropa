import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MessageCircle, FileQuestion, ExternalLink } from "lucide-react"

export default function AyudaPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h1>
                <p className="text-muted-foreground">
                    Soporte técnico y recursos para el uso del sistema
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5 text-primary" />
                            Soporte Directo
                        </CardTitle>
                        <CardDescription>
                            Contacta con nuestro equipo de soporte técnico
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <MessageCircle className="h-5 w-5 text-green-600" />
                            <div>
                                <p className="font-medium">WhatsApp</p>
                                <p className="text-sm text-muted-foreground">+1 (829) 555-0000</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto" asChild>
                                <a href="https://wa.me/18295550000" target="_blank" rel="noreferrer">Chat</a>
                            </Button>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <div>
                                <p className="font-medium">Correo Electrónico</p>
                                <p className="text-sm text-muted-foreground">soporte@tusistema.com</p>
                            </div>
                            <Button variant="ghost" size="sm" className="ml-auto" asChild>
                                <a href="mailto:soporte@tusistema.com">Enviar</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileQuestion className="h-5 w-5 text-primary" />
                            Preguntas Frecuentes
                        </CardTitle>
                        <CardDescription>
                            Respuestas rápidas a situaciones comunes
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">¿Cómo cambio el logo de mi tienda?</h4>
                            <p className="text-sm text-muted-foreground">
                                Ve a Configuración → Información del Negocio y pega el enlace de tu logo en el campo "URL del Logo".
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">¿Cómo agrego un nuevo usuario?</h4>
                            <p className="text-sm text-muted-foreground">
                                Solo los administradores pueden crear usuarios desde la sección "Usuarios" en el menú lateral.
                            </p>
                        </div>
                        <div className="pt-2">
                            <Button variant="outline" className="w-full gap-2" asChild>
                                <a href="https://docs.google.com/document/d/1X-PLACEHOLDER" target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                    Ver Documentación Completa
                                </a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
