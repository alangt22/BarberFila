"use client"

import { signOut } from "firebase/auth"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase-client"
import { useRouter } from "next/navigation"

type ItemFila = {
  id: number
  servico: string
  status: string
  horaEntrada: string
  usuario: {
    nome: string | null
    telefone: string | null
  }
}

type UserData = {
  id: string
  nome: string
  role: string
  // outros campos do seu banco Prisma
}

export default function PainelBarbeiro() {
  const [fila, setFila] = useState<ItemFila[]>([])
  const [user, setUser] = useState<any>(null) // Firebase user
  const [userData, setUserData] = useState<UserData | null>(null) // Dados do Prisma
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [accessDenied, setAccessDenied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [showClearAllModal, setShowClearAllModal] = useState(false)
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [messageSentTo, setMessageSentTo] = useState<number | null>(null)

  const navigate = useRouter()

  // Função para buscar dados do usuário no banco Prisma
  const fetchUserData = async (firebaseUid: string, idToken: string) => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ firebaseUid }),
      })

      if (response.ok) {
        const data = await response.json()
        return data.user
      } else {
        console.error("Erro ao buscar dados do usuário:", response.status)
        return null
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error)
      return null
    }
  }

  // Gerenciar estado de autenticação, token e dados do usuário
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser)
      setLoading(false)

      if (currentUser) {
        try {
          // Obter token JWT do Firebase
          const idToken = await currentUser.getIdToken()
          setToken(idToken)
          localStorage.setItem("token", idToken)

          // Buscar dados do usuário no banco Prisma
          const userDataFromDb = await fetchUserData(currentUser.uid, idToken)

          if (userDataFromDb) {
            setUserData(userDataFromDb)
            console.log("Dados do usuário:", userDataFromDb)

            // Verificar se o usuário tem role de barbeiro
            if (userDataFromDb.role !== "barbeiro") {
              console.log("Acesso negado: usuário não tem role de barbeiro")
              setAccessDenied(true)
            } else {
              setAccessDenied(false)
            }
          } else {
            console.log("Usuário não encontrado no banco de dados")
            setAccessDenied(true)
          }
        } catch (error) {
          console.error("Erro ao obter token ou buscar dados do usuário:", error)
          setToken(null)
          setUserData(null)
          localStorage.removeItem("token")
          setAccessDenied(true)
        }
      } else {
        // Limpar dados se não há usuário
        setToken(null)
        setUserData(null)
        setAccessDenied(false)
        localStorage.removeItem("token")
        navigate.push("/login-owner")
      }
    })

    return () => unsubscribe()
  }, [navigate])

  const fetchFila = async () => {
    if (!token || !user || !userData || userData.role !== "barbeiro") {
      console.log("Fetch bloqueado:", {
        token: !!token,
        user: !!user,
        userData: !!userData,
        role: userData?.role,
      })
      return
    }

    try {
      const res = await fetch("/api/fila", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        console.log("Dados da fila recebidos:", data)
        setFila(data)
      } else {
        console.error("Erro na resposta da API:", res.status, res.statusText)
        // Se token expirou, tentar renovar
        if (res.status === 401 && user) {
          try {
            const newToken = await user.getIdToken(true) // force refresh
            setToken(newToken)
            localStorage.setItem("token", newToken)
          } catch (error) {
            console.error("Erro ao renovar token:", error)
          }
        }
      }
    } catch (error) {
      console.error("Erro ao buscar fila:", error)
    }
  }

  useEffect(() => {
    // Só buscar a fila se o usuário estiver autenticado, tiver token, dados do usuário E role de barbeiro
    if (user && token && userData && userData.role === "barbeiro" && !loading && !accessDenied) {
      fetchFila()
      // Atualizar a cada 3 segundos
      const interval = setInterval(fetchFila, 3000)
      return () => clearInterval(interval)
    }
  }, [user, token, userData, loading, accessDenied])

  const atualizarStatus = async (id: number, novoStatus: string) => {
    if (!token || !user || !userData || userData.role !== "barbeiro") return

    const res = await fetch("/api/fila/status", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, status: novoStatus }),
    })
    if (res.ok) {
      fetchFila() // atualizar a lista depois da mudança
    } else {
      alert("Erro ao atualizar status")
    }
  }

  const excluirItem = async (id: number) => {
    if (!token || !user || !userData || userData.role !== "barbeiro") return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/fila/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        await fetchFila()
        setShowConfirmModal(false)
        setItemToDelete(null)
      } else {
        alert("Erro ao excluir item da fila")
      }
    } catch (error) {
      console.error("Erro ao excluir:", error)
      alert("Erro ao excluir item")
    } finally {
      setIsDeleting(false)
    }
  }

  const limparTodaLista = async () => {
    if (!token || !user || !userData || userData.role !== "barbeiro") return

    setIsDeleting(true)
    try {
      const res = await fetch("/api/fila/clear", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        await fetchFila()
        setShowClearAllModal(false)
      } else {
        alert("Erro ao limpar a fila")
      }
    } catch (error) {
      console.error("Erro ao limpar fila:", error)
      alert("Erro ao limpar a fila")
    } finally {
      setIsDeleting(false)
    }
  }

  const confirmarExclusao = (id: number) => {
    setItemToDelete(id)
    setShowConfirmModal(true)
  }

  const enviarMensagemWhatsApp = async (clienteId: number, nome: string, telefone: string) => {
    if (!token || !user || !userData || userData.role !== "barbeiro") return

    setIsSendingMessage(true)
    try {
      const res = await fetch("/api/whatsapp/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clienteId,
          nome,
          telefone,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        // Abrir WhatsApp Web em nova aba
        if (data.data?.whatsappWebUrl) {
          window.open(data.data.whatsappWebUrl, "_blank")
        }
        setMessageSentTo(clienteId)
        // Remover indicador após 3 segundos
        setTimeout(() => setMessageSentTo(null), 3000)
      } else {
        alert("Erro ao gerar link do WhatsApp")
      }
    } catch (error) {
      console.error("Erro ao enviar WhatsApp:", error)
      alert("Erro ao processar mensagem")
    } finally {
      setIsSendingMessage(false)
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      time: date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "aguardando":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "em_atendimento":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "finalizado":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      setToken(null)
      setUserData(null)
      localStorage.removeItem("token")
      navigate.push("/login-owner")
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se não há usuário autenticado, não renderizar nada (será redirecionado)
  if (!user) {
    return null
  }

  // Se acesso negado (não tem role de barbeiro ou não encontrado no banco)
  if (accessDenied || !userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-6">
            {!userData
              ? "Usuário não encontrado no sistema. Entre em contato com o administrador."
              : "Você não tem permissão para acessar o painel do barbeiro. Apenas usuários com role de 'barbeiro' podem acessar esta área."}
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              <strong>Email:</strong> {user?.email}
            </p>
            {userData && (
              <>
                <p className="text-sm text-gray-500">
                  <strong>Nome:</strong> {userData.nome}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Role atual:</strong> {userData.role}
                </p>
              </>
            )}
          </div>
          <div className="mt-8 space-y-3">
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Fazer Logout
            </button>
            <p className="text-xs text-gray-500">
              Entre em contato com o administrador para obter as permissões necessárias.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Próximo da fila: primeiro com status 'aguardando'
  const proximo = fila.find((item) => item.status === "aguardando")
  // Atendimento atual: primeiro com status 'em_atendimento'
  const atendimentoAtual = fila.find((item) => item.status === "em_atendimento")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Painel do Barbeiro</h1>
                <p className="text-gray-600">Gerencie a fila de atendimento</p>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-gray-500">
                    Olá, <strong>{userData?.nome}</strong>
                  </p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {userData?.role}
                  </span>
                </div>
              </div>
              <button
                className="ml-4 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200"
                onClick={handleLogout}
              >
                Sair
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                {fila.length} {fila.length === 1 ? "cliente" : "clientes"} na fila
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Atualizando</span>
              </div>
              {fila.length > 0 && (
                <button
                  onClick={() => setShowClearAllModal(true)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg transition-colors duration-200 border border-red-200"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Limpar Lista
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Próximo da Fila */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Próximo da Fila</h2>
            </div>
            {proximo ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Nome</span>
                      <p className="text-lg font-semibold text-gray-900">{proximo.usuario?.nome || "—"}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Telefone</span>
                      <p className="text-gray-700">{proximo.usuario?.telefone || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Serviço</span>
                        <p className="text-gray-700">{proximo.servico}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Chegou às</span>
                        <p className="text-gray-700">{formatTime(proximo.horaEntrada)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    onClick={() => atualizarStatus(proximo.id, "em_atendimento")}
                  >
                    <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.01M15 10h1.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Iniciar Atendimento
                  </button>
                  <button
                    onClick={() =>
                      enviarMensagemWhatsApp(proximo.id, proximo.usuario?.nome || "", proximo.usuario?.telefone || "")
                    }
                    disabled={isSendingMessage || !proximo.usuario?.telefone}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold px-4 py-3 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Avisar cliente via WhatsApp"
                  >
                    {isSendingMessage ? (
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : messageSentTo === proximo.id ? (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.485 3.515" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Nenhum cliente aguardando</p>
              </div>
            )}
          </div>

          {/* Atendimento Atual */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Atendimento Atual</h2>
            </div>
            {atendimentoAtual ? (
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <span className="text-sm font-medium text-blue-600">Nome</span>
                      <p className="text-lg font-semibold text-gray-900">{atendimentoAtual.usuario?.nome || "—"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-sm font-medium text-blue-600">Serviço</span>
                        <p className="text-gray-700">{atendimentoAtual.servico}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-600">Iniciado às</span>
                        <p className="text-gray-700">{formatTime(atendimentoAtual.horaEntrada)}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-blue-600">Status</span>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(atendimentoAtual.status)}`}
                      >
                        {atendimentoAtual.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  onClick={() => atualizarStatus(atendimentoAtual.id, "finalizado")}
                >
                  <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Finalizar Atendimento
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Não há atendimentos em andamento</p>
              </div>
            )}
          </div>
        </div>

        {/* Fila Completa */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Fila Completa</h2>
          {fila.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fila vazia</h3>
              <p className="text-gray-500">Não há clientes na fila no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fila.map((item, index) => {
                const dateTime = formatDateTime(item.horaEntrada)
                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
                          <div>
                            <span className="text-sm font-medium text-gray-500">Nome</span>
                            <p className="font-semibold text-gray-900">{item.usuario?.nome || "—"}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Serviço</span>
                            <p className="text-gray-700">{item.servico}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Horário</span>
                            <p className="text-gray-700">
                              {dateTime.time}
                              <span className="text-xs text-gray-500 block">{dateTime.date}</span>
                            </p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-500">Status</span>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {item.status === "em_atendimento" && (
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            onClick={() => atualizarStatus(item.id, "finalizado")}
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Finalizar
                          </button>
                        )}
                        {item.status === "aguardando" && item.usuario?.telefone && (
                          <button
                            onClick={() =>
                              enviarMensagemWhatsApp(item.id, item.usuario?.nome || "", item.usuario?.telefone || "")
                            }
                            disabled={isSendingMessage}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold px-3 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
                            title="Avisar via WhatsApp"
                          >
                            {messageSentTo === item.id ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.485 3.515" />
                              </svg>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => confirmarExclusao(item.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-2 rounded-lg transition-colors duration-200 border border-gray-300"
                          title="Excluir da fila"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Modal de Confirmação - Excluir Item */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar Exclusão</h3>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir este cliente da fila? Esta ação também removerá o usuário do sistema e
                  não pode ser desfeita.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowConfirmModal(false)
                      setItemToDelete(null)
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => itemToDelete && excluirItem(itemToDelete)}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Excluindo...
                      </div>
                    ) : (
                      "Excluir"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Confirmação - Limpar Lista */}
        {showClearAllModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Limpar Toda a Lista</h3>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir TODOS os clientes da fila? Esta ação removerá {fila.length}{" "}
                  {fila.length === 1 ? "cliente" : "clientes"} e todos os usuários do sistema. Esta ação não pode ser
                  desfeita.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowClearAllModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                    disabled={isDeleting}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={limparTodaLista}
                    disabled={isDeleting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Limpando...
                      </div>
                    ) : (
                      "Limpar Lista"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
