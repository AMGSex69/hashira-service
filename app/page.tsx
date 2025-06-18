"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ScriptGenerator from "@/components/script-generator"
import ExcelProcessor from "@/components/excel-processor"
import ChatMessageGenerator from "@/components/chat-message-generator"
import PosterGenerator from "@/components/poster-generator"
import { ChatMessageProvider } from "@/lib/chat-message-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { Star } from "lucide-react"

export default function Home() {
	const [activeTab, setActiveTab] = useState("scripts")

	// Загрузка активной вкладки из localStorage при монтировании
	useEffect(() => {
		const savedTab = localStorage.getItem("activeTab")
		if (savedTab) {
			setActiveTab(savedTab)
		}
	}, [])

	// Сохранение активной вкладки в localStorage при изменении
	const handleTabChange = (value: string) => {
		setActiveTab(value)
		localStorage.setItem("activeTab", value)
	}
	return (
		<ChatMessageProvider>
			<div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 dark:from-gray-900 dark:to-gray-800">
				<header className="border-b bg-white/80 backdrop-blur-md dark:bg-gray-950/80 sticky top-0 z-10">
					<div className="container mx-auto py-4 px-4 flex justify-between items-center">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-md shadow-orange-200 dark:shadow-orange-900/20 transition-all hover:scale-110 hover:rotate-45 duration-300">
								<Star size={20} className="fill-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-600 dark:from-orange-400 dark:to-amber-500">
									HashiraService
								</h1>
								<p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-0.5 tracking-wide">
									Сервис подготовки <span className="text-orange-600 dark:text-orange-400">скриптов</span>, <span className="text-amber-600 dark:text-amber-400">таблиц</span> и <span className="text-orange-500 dark:text-orange-300">плакатов</span>
								</p>
							</div>
						</div>
						<ThemeToggle />
					</div>
				</header>

				<main className="container mx-auto py-8 px-4 animate-fade-in">
					<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
						{/* Центрируем TabsList с помощью flex и justify-center */}
						<div className="flex justify-center mb-8">
							{/* Убираем max-w-md, чтобы контролировать ширину напрямую */}
							<TabsList className="flex justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-xl shadow-sm">
								<TabsTrigger value="scripts" className="rounded-lg px-6 py-2 relative">
									Генератор скриптов
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
								</TabsTrigger>
								<TabsTrigger value="excel" className="rounded-lg px-6 py-2 relative">
									Обработка таблиц
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
								</TabsTrigger>
								<TabsTrigger value="chat" className="rounded-lg px-6 py-2 relative">
									Сообщение в чат
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
								</TabsTrigger>
								<TabsTrigger value="posters" className="rounded-lg px-6 py-2 relative">
									Генератор плакатов
									<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="scripts">
							<ScriptGenerator />
						</TabsContent>

						<TabsContent value="excel">
							<ExcelProcessor />
						</TabsContent>

						<TabsContent value="chat">
							<ChatMessageGenerator />
						</TabsContent>

						<TabsContent value="posters">
							<PosterGenerator />
						</TabsContent>
					</Tabs>
				</main>

				<footer className="border-t bg-white/80 backdrop-blur-md dark:bg-gray-950/80 py-4 mt-10">
					<div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
						© 2025 HashiraService • Все права защищены
					</div>
				</footer>
			</div>
		</ChatMessageProvider>
	)
}
