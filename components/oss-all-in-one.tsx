"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import {
	ShoppingCart,
	Plus,
	Trash2,
	Download,
	FileText,
	MessageSquare,
	Image,
	Package,
	AlertCircle
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { scriptTemplates, smartIntercomInfo } from "@/lib/script-templates"
import { formatDate } from "@/lib/utils"
import { Document, Packer, Paragraph, TextRun } from "docx"
import JSZip from "jszip"
import * as XLSX from "xlsx"

// Список округов Москвы
const DISTRICTS = ["САО", "СВАО", "ВАО", "ЮВАО", "ЮАО", "ЮЗАО", "ЗАО", "СЗАО", "ЦАО", "ТиНАО", "ЗелАО"]

// Интерфейс для элемента корзины
interface CartItem {
	id: string
	address: string
	district: string
	scriptType: string
	topic: string
	completionDate: string
	round1StartDate: string
	round1StartTime: string
	round1EndTime: string
	round2StartDate: string
	round2StartTime: string
	round2EndTime: string
	administrator: string
	includeSmartIntercomInfo: boolean
	isIndividual: boolean
	// Поля для выбора сервисов
	generateScript: boolean
	generatePoster: boolean
	generateMessage: boolean
	generateExcel: boolean
	// Поля для плакатов
	posterPhone: string
	showPosterPhone: boolean
	// Поля для Excel
	excelFile: File | null
	ossNumber: string
	ossDate: string
}

export default function OssAllInOne() {
	const { toast } = useToast()

	// Состояние корзины
	const [cart, setCart] = useState<CartItem[]>([])
	const [processing, setProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Основные данные формы
	const [formData, setFormData] = useState({
		address: "",
		district: "",
		scriptType: "ego-rounds",
		topic: "",
		completionDate: "",
		round1StartDate: "",
		round1StartTime: "18:30",
		round1EndTime: "20:30",
		round2StartDate: "",
		round2StartTime: "18:30",
		round2EndTime: "20:30",
		administrator: "",
	})

	// Настройки
	const [includeSmartIntercomInfo, setIncludeSmartIntercomInfo] = useState(false)
	const [isIndividual, setIsIndividual] = useState(false)

	// Выбор сервисов
	const [services, setServices] = useState({
		generateScript: true,
		generatePoster: true,
		generateMessage: true,
		generateExcel: false,
	})

	// Настройки плакатов
	const [posterSettings, setPosterSettings] = useState({
		phone: "8 (499) 652-62-11",
		showPhone: true,
	})

	// Настройки Excel
	const [excelSettings, setExcelSettings] = useState({
		file: null as File | null,
		ossNumber: "",
		ossDate: "",
	})

	const [isLoaded, setIsLoaded] = useState(false)

	// Загрузка данных из localStorage при монтировании компонента
	useEffect(() => {
		const savedData = localStorage.getItem("ossAllInOneData")
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)
				setFormData(parsedData.formData || formData)
				setServices(parsedData.services || services)
				setPosterSettings(parsedData.posterSettings || posterSettings)
				setExcelSettings(parsedData.excelSettings || excelSettings)
				setIncludeSmartIntercomInfo(parsedData.includeSmartIntercomInfo || false)
				setIsIndividual(parsedData.isIndividual || false)
			} catch (error) {
				console.error("Ошибка при загрузке данных из localStorage:", error)
			}
		}
		setIsLoaded(true)
	}, [])

	// Сохранение данных в localStorage при изменении
	useEffect(() => {
		if (!isLoaded) return

		const dataToSave = {
			formData,
			services,
			posterSettings,
			excelSettings,
			includeSmartIntercomInfo,
			isIndividual,
		}
		localStorage.setItem("ossAllInOneData", JSON.stringify(dataToSave))
	}, [formData, services, posterSettings, excelSettings, includeSmartIntercomInfo, isIndividual, isLoaded])

	// Обработчики изменений
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	const handleServiceChange = (service: keyof typeof services, checked: boolean) => {
		setServices((prev) => ({ ...prev, [service]: checked }))
	}

	const handlePosterSettingChange = (setting: keyof typeof posterSettings, value: string | boolean) => {
		setPosterSettings((prev) => ({ ...prev, [setting]: value }))
	}

	const handleExcelSettingChange = (setting: keyof typeof excelSettings, value: string | File | null) => {
		setExcelSettings((prev) => ({ ...prev, [setting]: value }))
	}

	// Функция для генерации скрипта
	const generateScript = (item: CartItem) => {
		const template = scriptTemplates[item.scriptType]
		if (!template) {
			throw new Error(`Неизвестный тип скрипта: ${item.scriptType}`)
		}

		const scriptData = {
			district: item.district,
			address: item.address,
			topic: item.topic,
			completionDate: item.completionDate ? formatDate(item.completionDate) : "",
			round1StartDate: item.round1StartDate ? formatDate(item.round1StartDate) : "",
			round1StartTime: item.round1StartTime,
			round1EndTime: item.round1EndTime,
			round2StartDate: item.round2StartDate ? formatDate(item.round2StartDate) : "",
			round2StartTime: item.round2StartTime,
			round2EndTime: item.round2EndTime,
			administrator: item.administrator,
		}

		let script = template
		Object.entries(scriptData).forEach(([key, value]) => {
			const placeholder = `{{${key}}}`
			script = script.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), value)
		})

		if (item.includeSmartIntercomInfo) {
			script += `\n\n${smartIntercomInfo}`
		}

		return script
	}

	// Функция для генерации Word документа
	const generateWordDocument = async (item: CartItem) => {
		const script = generateScript(item)
		const scriptTypeName = getScriptTypeName(item.scriptType)
		const fileName = `Скрипт_${item.address}_${scriptTypeName}`

		const doc = new Document({
			sections: [{
				properties: {},
				children: [
					new Paragraph({
						children: [
							new TextRun({
								text: script,
								size: 24,
								font: "Times New Roman",
							}),
						],
					}),
				],
			}],
		})

		const buffer = await Packer.toBuffer(doc)
		return { buffer, fileName: `${fileName}.docx` }
	}

	// Функция для получения читаемого названия типа скрипта
	const getScriptTypeName = (scriptType: string) => {
		switch (scriptType) {
			case "ego-rounds": return "ЕГО с обходами"
			case "ego-no-rounds": return "ЕГО без обходов"
			case "not-ego-no-rounds": return "не ЕГО без обходов"
			case "not-ego-with-rounds": return "не ЕГО с обходами"
			default: return scriptType
		}
	}

	// Функция для генерации сообщения в чат
	const generateChatMessage = (items: CartItem[]) => {
		if (items.length === 0) return ""

		let messageText = "Коллеги, всем привет! \n\n❗️Добавлены новые адреса на обзвон❗️\n"

		items.forEach((item) => {
			let receptionOrder = ""
			if (item.scriptType.includes("ego")) {
				receptionOrder = "ЕГО ОСС"
			} else {
				receptionOrder = "не ЕГО ОСС"
			}

			messageText += `${item.district}, ${item.address}\n`
			messageText += `Порядок приема: ${receptionOrder}\n`

			if (item.round1StartDate || item.round2StartDate) {
				let roundDates = ""
				if (item.round1StartDate) {
					const date1 = formatDate(item.round1StartDate)
					roundDates += `${date1} (${item.round1StartTime}-${item.round1EndTime})`
				}
				if (item.round2StartDate) {
					const date2 = formatDate(item.round2StartDate)
					if (roundDates) roundDates += `\n${date2} (${item.round2StartTime}-${item.round2EndTime})`
					else roundDates += `${date2} (${item.round2StartTime}-${item.round2EndTime})`
				}
				messageText += `Обходы: ${roundDates}\n`
			} else {
				messageText += "Обходов нет\n"
			}

			messageText += "\n"
		})

		return messageText
	}

	// Функция для добавления в корзину
	const addToCart = () => {
		if (!formData.address || !formData.district) {
			setError("Пожалуйста, заполните адрес и округ")
			return
		}

		if (!Object.values(services).some(Boolean)) {
			setError("Выберите хотя бы один сервис")
			return
		}

		if (services.generateExcel) {
			if (!excelSettings.file) {
				setError("Выберите Excel файл для обработки")
				return
			}
			if (!excelSettings.ossNumber || !excelSettings.ossDate) {
				setError("Заполните номер ОСС и дату ОСС для обработки Excel")
				return
			}
		}

		const newItem: CartItem = {
			id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
			...formData,
			...services,
			...posterSettings,
			showPosterPhone: posterSettings.showPhone,
			posterPhone: posterSettings.phone,
			includeSmartIntercomInfo,
			isIndividual,
			excelFile: excelSettings.file,
			ossNumber: excelSettings.ossNumber,
			ossDate: excelSettings.ossDate,
		}

		setCart(prev => [...prev, newItem])
		resetCurrentForm()
		setError(null)

		toast({
			title: "Добавлено в корзину",
			description: `Адрес "${formData.address}" добавлен в корзину`,
		})
	}

	// Функция для сброса формы
	const resetCurrentForm = () => {
		setFormData({
			address: "",
			district: "",
			scriptType: "ego-rounds",
			topic: "",
			completionDate: "",
			round1StartDate: "",
			round1StartTime: "18:30",
			round1EndTime: "20:30",
			round2StartDate: "",
			round2StartTime: "18:30",
			round2EndTime: "20:30",
			administrator: "",
		})
		setExcelSettings({
			file: null,
			ossNumber: "",
			ossDate: "",
		})
	}

	// Функция для удаления из корзины
	const removeFromCart = (id: string) => {
		setCart(prev => prev.filter(item => item.id !== id))
	}

	// Функция для очистки корзины
	const clearCart = () => {
		setCart([])
	}

	// Функция для обработки Excel файла
	const processExcelFile = async (item: CartItem) => {
		if (!item.excelFile) {
			throw new Error("Файл Excel не найден")
		}

		// Читаем файл
		const data = await readFileAsync(item.excelFile)
		const workbook = XLSX.read(data, { type: "array" })

		// Получаем первый лист
		const firstSheetName = workbook.SheetNames[0]
		const worksheet = workbook.Sheets[firstSheetName]

		// Преобразуем в JSON для обработки
		const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: "A", defval: "" })

		// Удаляем ДВЕ строки заголовков
		jsonData.shift()
		jsonData.shift()

		// Фильтруем данные
		const filteredData = jsonData.filter((row: any) => {
			return !(
				row["G"] === "Нет" ||
				row["G"] === "-" ||
				row["G"] === "" ||
				row["H"] === "-" ||
				row["H"] === "" ||
				(row["A"] && row["A"].toString().includes("Участвовал"))
			)
		})

		// Преобразуем данные
		filteredData.forEach((row: any) => {
			if (row["C"] && !isNaN(Number(row["C"]))) {
				row["C"] = Number(row["C"])
			}
			if (row["H"]) {
				const phoneNumber = cleanPhoneNumber(row["H"].toString())
				if (phoneNumber.length > 0) {
					row["H"] = !isNaN(Number(phoneNumber)) ? Number(phoneNumber) : phoneNumber
				}
			}
		})

		// Форматируем даты обходов
		const roundDatesFormatted = formatRoundDatesForItem(item)

		// Создаем новый массив данных
		const processedData = filteredData.map((row: any) => {
			return {
				A: item.address,
				B: item.district,
				C: item.ossNumber,
				D: item.ossDate,
				E: row["C"],
				F: row["E"],
				G: row["H"],
				H: roundDatesFormatted,
			}
		})

		// Добавляем заголовки
		processedData.unshift({
			A: "Адрес",
			B: "Округ",
			C: "Номер ОСС",
			D: "Дата ОСС",
			E: "Квартира",
			F: "ФИО",
			G: "Телефон",
			H: "Даты обходов",
		})

		// Создаем новый лист
		const newWorksheet = XLSX.utils.json_to_sheet(processedData, { skipHeader: true })

		// Создаем новую книгу
		const newWorkbook = XLSX.utils.book_new()
		XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, "Обработанные данные")

		// Возвращаем как ArrayBuffer
		const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" })
		return excelBuffer
	}

	// Функция для чтения файла как ArrayBuffer
	const readFileAsync = (file: File): Promise<ArrayBuffer> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = (e) => {
				if (e.target?.result) {
					resolve(e.target.result as ArrayBuffer)
				} else {
					reject(new Error("Ошибка чтения файла"))
				}
			}
			reader.onerror = (e) => reject(e)
			reader.readAsArrayBuffer(file)
		})
	}

	// Функция для очистки телефонного номера
	const cleanPhoneNumber = (phoneStr: string): string => {
		let cleanPhone = phoneStr.replace(/\D/g, "")
		if (cleanPhone.startsWith("7")) {
			cleanPhone = cleanPhone.substring(1)
		}
		return cleanPhone
	}

	// Функция для форматирования дат обходов для конкретного элемента
	const formatRoundDatesForItem = (item: CartItem) => {
		let result = ""

		if (item.round1StartDate) {
			const date = new Date(item.round1StartDate)
			const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`
			result = `${formattedDate} (${item.round1StartTime}-${item.round1EndTime})`
		}

		if (item.round2StartDate) {
			const date2 = new Date(item.round2StartDate)
			const formattedDate2 = `${date2.getDate().toString().padStart(2, "0")}.${(date2.getMonth() + 1).toString().padStart(2, "0")}.${date2.getFullYear()}`
			result += result ? `\n${formattedDate2} (${item.round2StartTime}-${item.round2EndTime})` : `${formattedDate2} (${item.round2StartTime}-${item.round2EndTime})`
		}

		if (!result) {
			result = "Обходов нет"
		}

		return result
	}

	// Функция для обработки всей корзины
	const processCart = async () => {
		if (cart.length === 0) {
			setError("Корзина пуста")
			return
		}

		setProcessing(true)
		setError(null)

		try {
			const zip = new JSZip()

			// Создаем папки для разных типов файлов
			const scriptsFolder = zip.folder("Скрипты")
			const messagesFolder = zip.folder("Сообщения")
			const excelFolder = zip.folder("Таблицы")

			// Обрабатываем каждый элемент корзины
			for (const item of cart) {
				const folderName = `${item.district}_${item.address}`.replace(/[<>:"/\\|?*]/g, '_')

				// Генерируем скрипт, если нужно
				if (item.generateScript && scriptsFolder) {
					const { buffer, fileName } = await generateWordDocument(item)
					scriptsFolder.file(`${folderName}/${fileName}`, buffer)
				}

				// Обрабатываем Excel файл, если нужно
				if (item.generateExcel && item.excelFile && excelFolder) {
					const processedExcel = await processExcelFile(item)
					excelFolder.file(`${folderName}/Обработанные_данные.xlsx`, processedExcel)
				}
			}

			// Генерируем общее сообщение, если нужно
			const itemsWithMessage = cart.filter(item => item.generateMessage)
			if (itemsWithMessage.length > 0 && messagesFolder) {
				const chatMessage = generateChatMessage(itemsWithMessage)
				messagesFolder.file("chat_message.txt", chatMessage)
			}

			// Создаем ZIP файл
			const zipBlob = await zip.generateAsync({ type: "blob" })

			// Скачиваем файл
			const url = URL.createObjectURL(zipBlob)
			const a = document.createElement("a")
			a.href = url
			a.download = `ОСС_под_ключ_${cart.length}_адресов.zip`
			document.body.appendChild(a)
			a.click()

			// Очищаем ресурсы
			setTimeout(() => {
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			}, 0)

			toast({
				title: "Обработка завершена",
				description: `ZIP файл с материалами для ${cart.length} адресов успешно создан`,
			})

			clearCart()
		} catch (err) {
			console.error("Ошибка при обработке корзины:", err)
			setError("Произошла ошибка при создании ZIP файла")
		} finally {
			setProcessing(false)
		}
	}

	return (
		<Card className="glass-card card-hover shadow-lg">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Package className="h-5 w-5 text-primary" />
					<CardTitle>ОСС под ключ</CardTitle>
				</div>
				<CardDescription>
					Объединенный сервис для создания всех необходимых материалов для ОСС
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<Tabs defaultValue="form" className="w-full">
					<TabsList className="mb-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
						<TabsTrigger value="form" className="rounded-md px-4 py-2">
							Заполнение данных
						</TabsTrigger>
						<TabsTrigger value="services" className="rounded-md px-4 py-2">
							Выбор сервисов
						</TabsTrigger>
						<TabsTrigger value="cart" className="rounded-md px-4 py-2">
							<div className="flex items-center gap-2">
								<ShoppingCart className="h-4 w-4" />
								Корзина
								{cart.length > 0 && (
									<Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
										{cart.length}
									</Badge>
								)}
							</div>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="form" className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="address">Адрес дома *</Label>
								<Input
									id="address"
									name="address"
									value={formData.address}
									onChange={handleInputChange}
									placeholder="Например: ул. Ленина, д. 10"
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="district">Округ *</Label>
								<Select
									value={formData.district}
									onValueChange={(value) => handleSelectChange("district", value)}
								>
									<SelectTrigger className="bg-white dark:bg-gray-800">
										<SelectValue placeholder="Выберите округ" />
									</SelectTrigger>
									<SelectContent>
										{DISTRICTS.map((district) => (
											<SelectItem key={district} value={district}>
												{district}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="scriptType">Тип скрипта</Label>
								<Select
									value={formData.scriptType}
									onValueChange={(value) => handleSelectChange("scriptType", value)}
								>
									<SelectTrigger className="bg-white dark:bg-gray-800">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="ego-rounds">ЕГО с обходами</SelectItem>
										<SelectItem value="ego-no-rounds">ЕГО без обходов</SelectItem>
										<SelectItem value="not-ego-no-rounds">не ЕГО без обходов</SelectItem>
										<SelectItem value="not-ego-with-rounds">не ЕГО с обходами</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="topic">Тема ОСС</Label>
								<Input
									id="topic"
									name="topic"
									value={formData.topic}
									onChange={handleInputChange}
									placeholder="Например: выбор управляющей организации"
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="completionDate">Дата завершения ОСС</Label>
								<Input
									id="completionDate"
									name="completionDate"
									type="date"
									value={formData.completionDate}
									onChange={handleInputChange}
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="administrator">Администратор</Label>
								<Input
									id="administrator"
									name="administrator"
									value={formData.administrator}
									onChange={handleInputChange}
									placeholder="ФИО администратора"
									className="bg-white dark:bg-gray-800"
								/>
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="font-medium">Даты обходов</h3>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="round1StartDate">Дата первого обхода</Label>
									<Input
										id="round1StartDate"
										name="round1StartDate"
										type="date"
										value={formData.round1StartDate}
										onChange={handleInputChange}
										className="bg-white dark:bg-gray-800"
									/>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<div className="space-y-2">
										<Label htmlFor="round1StartTime">Время начала</Label>
										<Input
											id="round1StartTime"
											name="round1StartTime"
											type="time"
											value={formData.round1StartTime}
											onChange={handleInputChange}
											className="bg-white dark:bg-gray-800"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="round1EndTime">Время окончания</Label>
										<Input
											id="round1EndTime"
											name="round1EndTime"
											type="time"
											value={formData.round1EndTime}
											onChange={handleInputChange}
											className="bg-white dark:bg-gray-800"
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="round2StartDate">Дата второго обхода</Label>
									<Input
										id="round2StartDate"
										name="round2StartDate"
										type="date"
										value={formData.round2StartDate}
										onChange={handleInputChange}
										className="bg-white dark:bg-gray-800"
									/>
								</div>

								<div className="grid grid-cols-2 gap-2">
									<div className="space-y-2">
										<Label htmlFor="round2StartTime">Время начала</Label>
										<Input
											id="round2StartTime"
											name="round2StartTime"
											type="time"
											value={formData.round2StartTime}
											onChange={handleInputChange}
											className="bg-white dark:bg-gray-800"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="round2EndTime">Время окончания</Label>
										<Input
											id="round2EndTime"
											name="round2EndTime"
											type="time"
											value={formData.round2EndTime}
											onChange={handleInputChange}
											className="bg-white dark:bg-gray-800"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-4">
							<h3 className="font-medium">Дополнительные настройки</h3>

							<div className="space-y-4">
								<div className="flex items-center space-x-2">
									<Switch
										id="includeSmartIntercomInfo"
										checked={includeSmartIntercomInfo}
										onCheckedChange={setIncludeSmartIntercomInfo}
									/>
									<Label htmlFor="includeSmartIntercomInfo">
										Включить информацию о домофоне
									</Label>
								</div>

								<div className="flex items-center space-x-2">
									<Switch
										id="isIndividual"
										checked={isIndividual}
										onCheckedChange={setIsIndividual}
									/>
									<Label htmlFor="isIndividual">
										Индивидуальный скрипт
									</Label>
								</div>
							</div>
						</div>
					</TabsContent>

					<TabsContent value="services" className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-4">
								<h3 className="font-medium">Выберите сервисы</h3>

								<div className="space-y-4">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="generateScript"
											checked={services.generateScript}
											onCheckedChange={(checked) => handleServiceChange("generateScript", checked as boolean)}
										/>
										<Label htmlFor="generateScript" className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											Генерировать скрипт (Word)
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="generatePoster"
											checked={services.generatePoster}
											onCheckedChange={(checked) => handleServiceChange("generatePoster", checked as boolean)}
										/>
										<Label htmlFor="generatePoster" className="flex items-center gap-2">
											<Image className="h-4 w-4" />
											Генерировать плакат (в разработке)
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="generateMessage"
											checked={services.generateMessage}
											onCheckedChange={(checked) => handleServiceChange("generateMessage", checked as boolean)}
										/>
										<Label htmlFor="generateMessage" className="flex items-center gap-2">
											<MessageSquare className="h-4 w-4" />
											Генерировать сообщение в чат
										</Label>
									</div>

									<div className="flex items-center space-x-2">
										<Checkbox
											id="generateExcel"
											checked={services.generateExcel}
											onCheckedChange={(checked) => handleServiceChange("generateExcel", checked as boolean)}
										/>
										<Label htmlFor="generateExcel" className="flex items-center gap-2">
											<FileText className="h-4 w-4" />
											Обработать Excel таблицу
										</Label>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<h3 className="font-medium">Настройки плакатов</h3>

								<div className="space-y-4">
									<div className="flex items-center space-x-2">
										<Checkbox
											id="showPosterPhone"
											checked={posterSettings.showPhone}
											onCheckedChange={(checked) => handlePosterSettingChange("showPhone", checked as boolean)}
										/>
										<Label htmlFor="showPosterPhone">
											Показывать телефон на плакате
										</Label>
									</div>

									<div className="space-y-2">
										<Label htmlFor="posterPhone">Телефон для плаката</Label>
										<Input
											id="posterPhone"
											value={posterSettings.phone}
											onChange={(e) => handlePosterSettingChange("phone", e.target.value)}
											placeholder="8 (499) 652-62-11"
											className="bg-white dark:bg-gray-800"
										/>
									</div>
								</div>
							</div>

							<div className="space-y-4">
								<h3 className="font-medium">Настройки Excel</h3>

								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor="excelFile">Excel файл</Label>
										<Input
											id="excelFile"
											type="file"
											accept=".xlsx,.xls"
											onChange={(e) => {
												const file = e.target.files?.[0] || null
												handleExcelSettingChange("file", file)
											}}
											className="bg-white dark:bg-gray-800"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="ossNumber">Номер ОСС</Label>
										<Input
											id="ossNumber"
											value={excelSettings.ossNumber}
											onChange={(e) => handleExcelSettingChange("ossNumber", e.target.value)}
											placeholder="Например: 12345"
											className="bg-white dark:bg-gray-800"
										/>
									</div>

									<div className="space-y-2">
										<Label htmlFor="ossDate">Дата ОСС</Label>
										<Input
											id="ossDate"
											type="date"
											value={excelSettings.ossDate}
											onChange={(e) => handleExcelSettingChange("ossDate", e.target.value)}
											className="bg-white dark:bg-gray-800"
										/>
									</div>
								</div>
							</div>
						</div>

						<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-md">
							<h4 className="font-medium mb-2">Что будет создано:</h4>
							<ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
								{services.generateScript && <li>Word документ со скриптом для обзвона</li>}
								{services.generatePoster && <li>Плакат с информацией об обходах (в разработке)</li>}
								{services.generateMessage && <li>Текстовое сообщение для чата</li>}
								{services.generateExcel && <li>Обработанный Excel файл с данными</li>}
							</ul>
						</div>
					</TabsContent>

					<TabsContent value="cart" className="space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="font-medium">Адреса в корзине ({cart.length})</h3>
							{cart.length > 0 && (
								<Button onClick={clearCart} variant="outline" size="sm">
									<Trash2 className="h-4 w-4 mr-2" />
									Очистить корзину
								</Button>
							)}
						</div>

						{cart.length === 0 ? (
							<div className="text-center py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-md">
								<ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
								<p className="text-muted-foreground">Корзина пуста</p>
								<p className="text-sm text-muted-foreground">
									Заполните данные и выберите сервисы для добавления адреса
								</p>
							</div>
						) : (
							<div className="space-y-3">
								{cart.map((item, index) => (
									<div key={item.id} className="border p-4 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
										<div className="flex items-start justify-between">
											<div className="flex-1">
												<div className="flex items-center gap-2 mb-2">
													<Badge variant="outline">#{index + 1}</Badge>
													<h4 className="font-medium">{item.address}</h4>
												</div>
												<div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
													<div>
														<span className="font-medium">Округ:</span> {item.district}
													</div>
													<div>
														<span className="font-medium">Тип:</span> {getScriptTypeName(item.scriptType)}
													</div>
													<div>
														<span className="font-medium">Тема:</span> {item.topic || "Не указана"}
													</div>
													<div>
														<span className="font-medium">Дата завершения:</span> {item.completionDate ? formatDate(item.completionDate) : "Не указана"}
													</div>
												</div>
												<div className="mt-2 flex flex-wrap gap-1">
													{item.generateScript && <Badge variant="secondary">Скрипт</Badge>}
													{item.generatePoster && <Badge variant="secondary">Плакат</Badge>}
													{item.generateMessage && <Badge variant="secondary">Сообщение</Badge>}
													{item.generateExcel && <Badge variant="secondary">Excel</Badge>}
												</div>
											</div>
											<Button
												onClick={() => removeFromCart(item.id)}
												variant="outline"
												size="sm"
												className="ml-4"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>

				{error && (
					<Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 backdrop-blur-sm">
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Ошибка</AlertTitle>
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}
			</CardContent>
			<CardFooter className="flex gap-2 justify-between">
				<Button onClick={resetCurrentForm} variant="outline" disabled={processing}>
					Сбросить форму
				</Button>
				<div className="flex gap-2">
					<Button
						onClick={addToCart}
						disabled={processing}
						className="flex items-center gap-2"
					>
						<Plus className="h-4 w-4" />
						Добавить в корзину
					</Button>
					<Button
						onClick={processCart}
						disabled={cart.length === 0 || processing}
						className="gradient-bg border-0 flex items-center gap-2"
					>
						<Download className="h-4 w-4" />
						{processing ? "Обработка..." : `Скачать ZIP (${cart.length})`}
					</Button>
				</div>
			</CardFooter>
		</Card>
	)
} 