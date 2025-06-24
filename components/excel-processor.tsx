"use client"

import type React from "react"

import { useState, useEffect } from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle, FileSpreadsheet, Upload, Table } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "lucide-react"

const DISTRICTS = ["ЦАО", "САО", "СВАО", "ВАО", "ЮВАО", "ЮАО", "ЮЗАО", "ЗАО", "СЗАО", "Зеленоград", "Новая Москва"]

export default function ExcelProcessor() {
	const { toast } = useToast()
	const [file, setFile] = useState<File | null>(null)
	const [processing, setProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Добавляем состояния для пользовательских данных
	const [address, setAddress] = useState("")
	const [district, setDistrict] = useState("")
	const [ossNumber, setOssNumber] = useState("")
	const [ossDate, setOssDate] = useState("")

	// Состояния для дат обходов
	const [round1Type, setRound1Type] = useState("date") // "date" или "status"
	const [round1Status, setRound1Status] = useState("cancelled") // "cancelled" или "none"
	const [round1Date, setRound1Date] = useState("")
	const [round1StartTime, setRound1StartTime] = useState("18:00")
	const [round1EndTime, setRound1EndTime] = useState("20:30")

	const [useRound2, setUseRound2] = useState(false)
	const [round2Type, setRound2Type] = useState("date") // "date" или "status"
	const [round2Status, setRound2Status] = useState("cancelled") // "cancelled" или "none"
	const [round2Date, setRound2Date] = useState("")
	const [round2StartTime, setRound2StartTime] = useState("18:00")
	const [round2EndTime, setRound2EndTime] = useState("20:30")
	const [isLoaded, setIsLoaded] = useState(false)

	// Загрузка данных из localStorage при монтировании компонента
	useEffect(() => {
		const savedData = localStorage.getItem("excelProcessorData")
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData)
				setAddress(parsedData.address || "")
				setDistrict(parsedData.district || "")
				setOssNumber(parsedData.ossNumber || "")
				setOssDate(parsedData.ossDate || "")
				setRound1Type(parsedData.round1Type || "date")
				setRound1Status(parsedData.round1Status || "cancelled")
				setRound1Date(parsedData.round1Date || "")
				setRound1StartTime(parsedData.round1StartTime || "18:00")
				setRound1EndTime(parsedData.round1EndTime || "20:30")
				setUseRound2(parsedData.useRound2 || false)
				setRound2Type(parsedData.round2Type || "date")
				setRound2Status(parsedData.round2Status || "cancelled")
				setRound2Date(parsedData.round2Date || "")
				setRound2StartTime(parsedData.round2StartTime || "18:00")
				setRound2EndTime(parsedData.round2EndTime || "20:30")
			} catch (error) {
				console.error("Ошибка при загрузке данных из localStorage:", error)
			}
		}
		setIsLoaded(true)
	}, [])

	// Сохранение данных в localStorage при изменении (только после загрузки)
	useEffect(() => {
		if (!isLoaded) return

		const dataToSave = {
			address,
			district,
			ossNumber,
			ossDate,
			round1Type,
			round1Status,
			round1Date,
			round1StartTime,
			round1EndTime,
			useRound2,
			round2Type,
			round2Status,
			round2Date,
			round2StartTime,
			round2EndTime,
		}
		localStorage.setItem("excelProcessorData", JSON.stringify(dataToSave))
	}, [address, district, ossNumber, ossDate, round1Type, round1Status, round1Date, round1StartTime, round1EndTime, useRound2, round2Type, round2Status, round2Date, round2StartTime, round2EndTime, isLoaded])

	const resetForm = () => {
		setFile(null)
		setAddress("")
		setDistrict("")
		setOssNumber("")
		setOssDate("")
		setRound1Type("date")
		setRound1Status("cancelled")
		setRound1Date("")
		setRound1StartTime("18:00")
		setRound1EndTime("20:30")
		setUseRound2(false)
		setRound2Type("date")
		setRound2Status("cancelled")
		setRound2Date("")
		setRound2StartTime("18:00")
		setRound2EndTime("20:30")
		setError(null)
		localStorage.removeItem("excelProcessorData")
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files.length > 0) {
			const selectedFile = e.target.files[0]
			// Проверяем, что это Excel-файл
			if (
				selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
				selectedFile.type === "application/vnd.ms-excel" ||
				selectedFile.name.endsWith(".xlsx") ||
				selectedFile.name.endsWith(".xls")
			) {
				setFile(selectedFile)
				setError(null)
			} else {
				setFile(null)
				setError("Пожалуйста, выберите файл Excel (.xlsx или .xls)")
			}
		}
	}

	// Форматирование дат обходов
	const formatRoundDates = () => {
		let result = ""

		if (round1Type === "date") {
			if (round1Date) {
				const date = new Date(round1Date)
				const formattedDate = `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`
				result = `${formattedDate} (${round1StartTime}-${round1EndTime})`
			}
		} else {
			result = round1Status === "cancelled" ? "Обход отменен" : "Обхода нет"
		}

		if (useRound2) {
			if (round2Type === "date") {
				if (round2Date) {
					const date2 = new Date(round2Date)
					const formattedDate2 = `${date2.getDate().toString().padStart(2, "0")}.${(date2.getMonth() + 1).toString().padStart(2, "0")}.${date2.getFullYear()}`
					result += result
						? `\n${formattedDate2} (${round2StartTime}-${round2EndTime})`
						: `${formattedDate2} (${round2StartTime}-${round2EndTime})`
				}
			} else {
				const statusText = round2Status === "cancelled" ? "Обход отменен" : "Обхода нет"
				result += result ? `\n${statusText}` : statusText
			}
		}

		return result
	}

	// Обработчик для вставки в поле даты ОСС
	const handleOssDatePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
		e.preventDefault()
		const pastedText = e.clipboardData.getData("text")

		// Проверяем, соответствует ли текст формату DD.MM.YYYY
		const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
		const match = pastedText.match(datePattern)

		if (match) {
			// Если соответствует, преобразуем в формат YYYY-MM-DD для input type="date"
			const day = match[1]
			const month = match[2]
			const year = match[3]
			const formattedDate = `${year}-${month}-${day}`
			setOssDate(formattedDate)
		} else {
			// Если не соответствует, просто устанавливаем как есть
			setOssDate(pastedText)
		}
	}

	// Обработчик для вставки в поля дат обходов
	const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, setDateFunc: (value: string) => void) => {
		e.preventDefault()
		const pastedText = e.clipboardData.getData("text")

		// Проверяем, соответствует ли текст формату DD.MM.YYYY
		const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/
		const match = pastedText.match(datePattern)

		if (match) {
			// Если соответствует, преобразуем в формат YYYY-MM-DD для input type="date"
			const day = match[1]
			const month = match[2]
			const year = match[3]
			const formattedDate = `${year}-${month}-${day}`
			setDateFunc(formattedDate)
		} else {
			// Если не соответствует, просто устанавливаем как есть
			setDateFunc(pastedText)
		}
	}

	const processExcel = async () => {
		if (!file) {
			setError("Пожалуйста, выберите файл Excel для обработки")
			return
		}

		if (!address || !district || !ossNumber || !ossDate) {
			setError("Пожалуйста, заполните все обязательные поля")
			return
		}

		if (round1Type === "date" && !round1Date) {
			setError("Пожалуйста, укажите дату первого обхода или выберите статус")
			return
		}

		if (useRound2 && round2Type === "date" && !round2Date) {
			setError("Пожалуйста, укажите дату второго обхода или выберите статус")
			return
		}

		setProcessing(true)
		setError(null)

		try {
			// Чтение файла
			const data = await readFileAsync(file)
			const workbook = XLSX.read(data, { type: "array" })

			// Получаем первый лист
			const firstSheetName = workbook.SheetNames[0]
			const worksheet = workbook.Sheets[firstSheetName]

			// Преобразуем в JSON для обработки
			const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: "A", defval: "" })

			// Удаляем первую строку (заголовки)
			jsonData.shift()

			// Фильтруем данные
			const filteredData = jsonData.filter((row: any) => {
				// Проверяем условия фильтрации
				return !(
					row["G"] === "Нет" ||
					row["G"] === "-" ||
					row["G"] === "" ||
					row["H"] === "-" ||
					row["H"] === "" ||
					(row["A"] && row["A"].toString().includes("Участвовал"))
				)
			})

			// Преобразуем столбец C в числа
			filteredData.forEach((row: any) => {
				if (row["C"] && !isNaN(Number(row["C"]))) {
					row["C"] = Number(row["C"])
				}
			})

			// Очищаем и преобразуем телефонные номера в столбце H
			filteredData.forEach((row: any) => {
				if (row["H"]) {
					// Удаляем все нецифровые символы
					const phoneNumber = cleanPhoneNumber(row["H"].toString())

					// Если номер не пустой, сохраняем его обратно
					if (phoneNumber.length > 0) {
						row["H"] = !isNaN(Number(phoneNumber)) ? Number(phoneNumber) : phoneNumber
					}
				}
			})

			// Форматируем даты обходов
			const roundDatesFormatted = formatRoundDates()

			// Создаем новый массив данных с нужными столбцами
			const processedData = filteredData.map((row: any) => {
				return {
					// Столбцы A, B, C, D заполняем значениями из формы
					A: address,
					B: district,
					C: ossNumber,
					D: ossDate,
					// Столбцы E, F, G берем из C, E, H исходной таблицы
					E: row["C"],
					F: row["E"],
					G: row["H"],
					// Столбец H заполняем датами обходов
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

			// Экспортируем файл через браузерный API
			const excelBuffer = XLSX.write(newWorkbook, { bookType: "xlsx", type: "array" })
			const blob = new Blob([excelBuffer], {
				type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			})
			const url = URL.createObjectURL(blob)

			// Создаем ссылку для скачивания
			const a = document.createElement("a")
			a.href = url
			a.download = "Обработанные_данные.xlsx"
			document.body.appendChild(a)
			a.click()

			// Очищаем ресурсы
			setTimeout(() => {
				document.body.removeChild(a)
				URL.revokeObjectURL(url)
			}, 0)

			toast({
				title: "Обработка завершена",
				description: "Файл успешно обработан и скачан",
			})
		} catch (err) {
			console.error("Ошибка при обработке файла:", err)
			setError("Произошла ошибка при обработке файла. Проверьте формат и структуру файла.")
		} finally {
			setProcessing(false)
		}
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

	// Функция для очистки телефонного номера от нецифровых символов
	const cleanPhoneNumber = (phoneStr: string): string => {
		return phoneStr.replace(/\D/g, "")
	}

	return (
		<Card className="glass-card card-hover shadow-lg">
			<CardHeader>
				<div className="flex items-center gap-2">
					<Table className="h-5 w-5 text-primary" />
					<CardTitle>Обработка Excel-таблиц</CardTitle>
				</div>
				<CardDescription>Загрузите Excel-файл и заполните данные для обработки</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<Tabs defaultValue="file" className="w-full">
					{/* Обновим стиль TabsList в компоненте ExcelProcessor */}
					<TabsList className="mb-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
						<TabsTrigger value="file" className="rounded-md px-4 py-2 relative">
							Загрузка файла
							<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
						</TabsTrigger>
						<TabsTrigger value="data" className="rounded-md px-4 py-2 relative">
							Данные для обработки
							<div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full scale-x-0 transition-transform duration-300 data-[state=active]:scale-x-100"></div>
						</TabsTrigger>
					</TabsList>

					<TabsContent value="file" className="space-y-4 animate-fade-in">
						<div className="space-y-2">
							<Label htmlFor="excel-file">Выберите Excel-файл</Label>
							<div className="flex items-center gap-2">
								<Input
									id="excel-file"
									type="file"
									accept=".xlsx,.xls"
									onChange={handleFileChange}
									disabled={processing}
									className="flex-1 bg-white dark:bg-gray-800"
								/>
								<Button
									variant="outline"
									size="icon"
									onClick={() => document.getElementById("excel-file")?.click()}
									disabled={processing}
									className="rounded-full"
								>
									<Upload className="h-4 w-4" />
								</Button>
							</div>
							{file && (
								<p className="text-sm text-muted-foreground flex items-center gap-2 p-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-md">
									<FileSpreadsheet className="h-4 w-4 text-green-500" />
									{file.name} ({(file.size / 1024).toFixed(1)} KB)
								</p>
							)}
						</div>

						<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-4 rounded-md">
							<h3 className="font-medium mb-2">Что делает обработчик:</h3>
							<ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
								<li>Фильтрует строки по заданным условиям</li>
								<li>Очищает и форматирует телефонные номера</li>
								<li>Преобразует числовые значения</li>
								<li>Реорганизует структуру таблицы</li>
								<li>Создает новый Excel-файл с обработанными данными</li>
							</ul>
						</div>
					</TabsContent>

					<TabsContent value="data" className="space-y-4 animate-fade-in">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="address">Адрес дома *</Label>
								<Input
									id="address"
									value={address}
									onChange={(e) => setAddress(e.target.value)}
									placeholder="Например: ул. Ленина, д. 10"
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="district">Округ *</Label>
								<Select value={district} onValueChange={setDistrict}>
									<SelectTrigger id="district" className="bg-white dark:bg-gray-800">
										<SelectValue placeholder="Выберите округ" />
									</SelectTrigger>
									<SelectContent>
										{DISTRICTS.map((districtOption) => (
											<SelectItem key={districtOption} value={districtOption}>
												{districtOption}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ossNumber">Номер ОСС *</Label>
								<Input
									id="ossNumber"
									value={ossNumber}
									onChange={(e) => setOssNumber(e.target.value)}
									placeholder="Например: 12345"
									className="bg-white dark:bg-gray-800"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="ossDate">Дата завершения ОСС *</Label>
								<Input
									id="ossDate"
									type="date"
									value={ossDate}
									onChange={(e) => setOssDate(e.target.value)}
									onPaste={handleOssDatePaste}
									className="bg-white dark:bg-gray-800"
									placeholder="Выберите дату"
								/>
							</div>
						</div>

						<Separator className="my-4" />

						<div className="space-y-4">
							<h3 className="font-medium">Даты обходов</h3>

							<div className="border p-4 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
								<h4 className="text-sm font-medium mb-3">Первый обход *</h4>

								<RadioGroup value={round1Type} onValueChange={setRound1Type} className="mb-4">
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="date" id="round1-date" />
										<Label htmlFor="round1-date">Указать дату и время</Label>
									</div>
									<div className="flex items-center space-x-2">
										<RadioGroupItem value="status" id="round1-status" />
										<Label htmlFor="round1-status">Указать статус</Label>
									</div>
								</RadioGroup>

								{round1Type === "date" ? (
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="space-y-2">
											<Label htmlFor="round1Date">Дата</Label>
											<Input
												id="round1Date"
												type="date"
												value={round1Date}
												onChange={(e) => setRound1Date(e.target.value)}
												onPaste={(e) => handleDatePaste(e, setRound1Date)}
												className="bg-white dark:bg-gray-800"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="round1StartTime">Время начала</Label>
											<Input
												id="round1StartTime"
												type="time"
												value={round1StartTime}
												onChange={(e) => setRound1StartTime(e.target.value)}
												className="bg-white dark:bg-gray-800"
											/>
										</div>

										<div className="space-y-2">
											<Label htmlFor="round1EndTime">Время окончания</Label>
											<Input
												id="round1EndTime"
												type="time"
												value={round1EndTime}
												onChange={(e) => setRound1EndTime(e.target.value)}
												className="bg-white dark:bg-gray-800"
											/>
										</div>
									</div>
								) : (
									<div className="space-y-2">
										<Label htmlFor="round1Status">Статус</Label>
										<Select value={round1Status} onValueChange={setRound1Status}>
											<SelectTrigger id="round1Status" className="bg-white dark:bg-gray-800">
												<SelectValue placeholder="Выберите статус" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="cancelled">Обход отменен</SelectItem>
												<SelectItem value="none">Обхода нет</SelectItem>
											</SelectContent>
										</Select>
									</div>
								)}
							</div>

							<div className="flex items-center space-x-2">
								<input
									type="checkbox"
									id="useRound2"
									checked={useRound2}
									onChange={(e) => setUseRound2(e.target.checked)}
									className="rounded border-gray-300"
								/>
								<Label htmlFor="useRound2">Добавить второй обход</Label>
							</div>

							{useRound2 && (
								<div className="border p-4 rounded-md bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
									<h4 className="text-sm font-medium mb-3">Второй обход</h4>

									<RadioGroup value={round2Type} onValueChange={setRound2Type} className="mb-4">
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="date" id="round2-date" />
											<Label htmlFor="round2-date">Указать дату и время</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="status" id="round2-status" />
											<Label htmlFor="round2-status">Указать статус</Label>
										</div>
									</RadioGroup>

									{round2Type === "date" ? (
										<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
											<div className="space-y-2">
												<Label htmlFor="round2Date">Дата</Label>
												<Input
													id="round2Date"
													type="date"
													value={round2Date}
													onChange={(e) => setRound2Date(e.target.value)}
													onPaste={(e) => handleDatePaste(e, setRound2Date)}
													className="bg-white dark:bg-gray-800"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="round2StartTime">Время начала</Label>
												<Input
													id="round2StartTime"
													type="time"
													value={round2StartTime}
													onChange={(e) => setRound2StartTime(e.target.value)}
													className="bg-white dark:bg-gray-800"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="round2EndTime">Время окончания</Label>
												<Input
													id="round2EndTime"
													type="time"
													value={round2EndTime}
													onChange={(e) => setRound2EndTime(e.target.value)}
													className="bg-white dark:bg-gray-800"
												/>
											</div>
										</div>
									) : (
										<div className="space-y-2">
											<Label htmlFor="round2Status">Статус</Label>
											<Select value={round2Status} onValueChange={setRound2Status}>
												<SelectTrigger id="round2Status" className="bg-white dark:bg-gray-800">
													<SelectValue placeholder="Выберите статус" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="cancelled">Обход отменен</SelectItem>
													<SelectItem value="none">Обхода нет</SelectItem>
												</SelectContent>
											</Select>
										</div>
									)}
								</div>
							)}

							<div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-3 rounded-md text-sm text-muted-foreground">
								<p>
									Примеры форматирования: <br />
									<span className="font-mono">
										10.02.2025 (18:00-20:30)
										<br />
										Обход отменен
										<br />
										Обхода нет
									</span>
								</p>
							</div>
						</div>
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
				<Button onClick={resetForm} variant="outline" disabled={processing}>
					Сбросить
				</Button>
				<Button onClick={processExcel} disabled={!file || processing} className="gradient-bg border-0">
					{processing ? "Обработка..." : "Обработать и скачать"}
				</Button>
			</CardFooter>
		</Card>
	)
}
