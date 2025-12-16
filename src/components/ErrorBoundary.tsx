import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
    children?: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Algo salió mal</h2>
                        <div className="bg-red-50 p-4 rounded border border-red-200 mb-6 overflow-auto max-h-48">
                            <code className="text-sm text-red-800 font-mono">
                                {this.state.error?.message || 'Error desconocido'}
                            </code>
                        </div>
                        <p className="text-gray-600 mb-6">
                            Ha ocurrido un error inesperado. Por favor, intente recargar la página.
                        </p>
                        <button
                            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded hover:bg-blue-700 transition"
                            onClick={() => window.location.reload()}
                        >
                            Recargar Página
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}
