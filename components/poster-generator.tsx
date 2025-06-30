'use client';

import React, { useState, useEffect } from 'react';
import MoscowPoster from "./MoscowPoster";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, X, Download, FileText } from "lucide-react";
import { Clock, Calendar } from "lucide-react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function PosterGenerator() {
	const [dates, setDates] = useState({
		first: {
			date: '',
			isoDate: '',  // Для HTML5 календаря
			timeStart: '',
			timeEnd: ''
		},
		second: {
			date: '',
			isoDate: '',  // Для HTML5 календаря
			timeStart: '',
			timeEnd: ''
		}
	});
	const [phone, setPhone] = useState('8 (499) 652-62-11');
	const [showPhone, setShowPhone] = useState(true);
	const [isLoaded, setIsLoaded] = useState(false);

	// Загрузка сохраненного состояния при монтировании компонента
	useEffect(() => {
		const savedData = localStorage.getItem('posterGeneratorData');
		if (savedData) {
			try {
				const parsedData = JSON.parse(savedData);
				if (parsedData.dates) {
					setDates(parsedData.dates);
				}
				if (parsedData.phone) {
					setPhone(parsedData.phone);
				}
				if (parsedData.showPhone !== undefined) {
					setShowPhone(parsedData.showPhone);
				}
			} catch (error) {
				console.error('Ошибка при загрузке сохраненных данных:', error);
			}
		}
		setIsLoaded(true);
	}, []);

	// Сохранение состояния при изменении данных (только после загрузки)
	useEffect(() => {
		if (!isLoaded) return;

		const dataToSave = {
			dates,
			phone,
			showPhone
		};
		localStorage.setItem('posterGeneratorData', JSON.stringify(dataToSave));
	}, [dates, phone, showPhone, isLoaded]);

	// Получаем время для второй даты (если не указано, используем время первой)
	const getSecondDateTime = () => {
		if (!dates.second) return { timeStart: '', timeEnd: '' };
		return {
			timeStart: dates.second.timeStart || dates.first.timeStart,
			timeEnd: dates.second.timeEnd || dates.first.timeEnd
		};
	};

	// Функция для распознавания и конвертации различных форматов даты
	const parseDateFromClipboard = (clipboardText: string): string | null => {
		const cleanText = clipboardText.trim();

		// Уже в ISO формате (YYYY-MM-DD)
		if (/^\d{4}-\d{2}-\d{2}$/.test(cleanText)) {
			return cleanText;
		}

		// Форматы с точками (DD.MM.YYYY, D.M.YYYY)
		const dotFormat = cleanText.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
		if (dotFormat) {
			const [, day, month, year] = dotFormat;
			return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
		}

		// Форматы с слешами (DD/MM/YYYY, MM/DD/YYYY)
		const slashFormat = cleanText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
		if (slashFormat) {
			const [, first, second, year] = slashFormat;
			// Предполагаем DD/MM/YYYY (европейский формат)
			return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
		}

		// Русские месяцы (DD месяц YYYY)
		const monthNames = {
			'январь': '01', 'января': '01',
			'февраль': '02', 'февраля': '02',
			'март': '03', 'марта': '03',
			'апрель': '04', 'апреля': '04',
			'май': '05', 'мая': '05',
			'июнь': '06', 'июня': '06',
			'июль': '07', 'июля': '07',
			'август': '08', 'августа': '08',
			'сентябрь': '09', 'сентября': '09',
			'октябрь': '10', 'октября': '10',
			'ноябрь': '11', 'ноября': '11',
			'декабрь': '12', 'декабря': '12'
		};

		const russianFormat = cleanText.toLowerCase().match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
		if (russianFormat) {
			const [, day, monthName, year] = russianFormat;
			const monthNumber = monthNames[monthName as keyof typeof monthNames];
			if (monthNumber) {
				return `${year}-${monthNumber}-${day.padStart(2, '0')}`;
			}
		}

		// Попытка использовать Date.parse для других форматов
		try {
			const parsedDate = new Date(cleanText);
			if (!isNaN(parsedDate.getTime())) {
				return parsedDate.toISOString().split('T')[0];
			}
		} catch (e) {
			// Игнорируем ошибки парсинга
		}

		return null;
	};

	// Обработчик вставки для полей даты
	const handleDatePaste = (e: React.ClipboardEvent<HTMLInputElement>, dayKey: 'first' | 'second') => {
		e.preventDefault();
		const clipboardText = e.clipboardData.getData('text');
		const parsedDate = parseDateFromClipboard(clipboardText);

		if (parsedDate) {
			handleDateChange(parsedDate, dayKey);
		} else {
			// Если не удалось распознать формат, показываем подсказку
			alert('Не удалось распознать формат даты. Поддерживаются форматы:\n• DD.MM.YYYY (например, 15.03.2024)\n• DD/MM/YYYY (например, 15/03/2024)\n• DD месяца YYYY (например, 15 марта 2024)\n• YYYY-MM-DD (например, 2024-03-15)');
		}
	};

	// Обработчик быстрого выбора времени
	const handleQuickTimeSelect = (dayKey: 'first' | 'second', timeType: 'start' | 'end', value: string) => {
		const timeKey = timeType === 'start' ? 'timeStart' : 'timeEnd';
		setDates(prev => ({
			...prev,
			[dayKey]: {
				...prev[dayKey],
				[timeKey]: value
			}
		}));
	};

	// Функция преобразования ISO даты в нужный формат
	const convertISOToDisplayDate = (isoDate: string): string => {
		if (!isoDate) return '';

		const date = new Date(isoDate);
		const months = [
			'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
			'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
		];

		const day = date.getDate();
		const month = months[date.getMonth()];

		return `${day} ${month}`;
	};

	// Обработчик изменения даты
	const handleDateChange = (value: string, dayKey: 'first' | 'second') => {
		const displayDate = convertISOToDisplayDate(value);
		setDates(prev => ({
			...prev,
			[dayKey]: {
				...prev[dayKey],
				date: displayDate,  // Сохраняем в нужном формате для отображения
				isoDate: value      // Сохраняем ISO формат для календаря
			}
		}));
	};

	// Обработчик очистки даты и времени
	const clearDateAndTime = (dayKey: 'first' | 'second') => {
		setDates(prev => ({
			...prev,
			[dayKey]: {
				date: '',
				isoDate: '',
				timeStart: '',
				timeEnd: ''
			}
		}));
	};

	// Обработчик сброса всех полей
	const resetAllFields = () => {
		setDates({
			first: {
				date: '',
				isoDate: '',
				timeStart: '',
				timeEnd: ''
			},
			second: {
				date: '',
				isoDate: '',
				timeStart: '',
				timeEnd: ''
			}
		});
		setPhone('8 (499) 652-62-11');
		setShowPhone(true);
		// Очищаем сохраненные данные
		localStorage.removeItem('posterGeneratorData');
	};

	// Функция для экспорта в PDF
	const handleExportPDF = async () => {
		const posterElement = document.querySelector('.moscow-poster-container');
		if (!posterElement) return;

		try {
			// Временно добавляем классы для экспорта в PDF
			const dateElements = posterElement.querySelectorAll('.poster-date-underline');
			posterElement.classList.add('pdf-export-mode');

			dateElements.forEach((el) => {
				el.classList.add('pdf-export-mode');
			});

			const canvas = await html2canvas(posterElement as HTMLElement, {
				scale: 3,
				useCORS: true,
				allowTaint: true,
				backgroundColor: '#ffffff',
				logging: false,
				width: posterElement.scrollWidth,
				height: posterElement.scrollHeight,
				scrollX: 0,
				scrollY: 0,
				foreignObjectRendering: false
			});

			// Убираем временные классы
			posterElement.classList.remove('pdf-export-mode');
			dateElements.forEach((el) => {
				el.classList.remove('pdf-export-mode');
			});

			const imgData = canvas.toDataURL('image/png');
			const pdf = new jsPDF({
				orientation: 'portrait',
				unit: 'mm',
				format: 'a4'
			});

			const pageWidth = 210; // A4 width in mm
			const pageHeight = 297; // A4 height in mm

			// Рассчитываем размеры так, чтобы плакат поместился на одну страницу
			const canvasRatio = canvas.width / canvas.height;
			const pageRatio = pageWidth / pageHeight;

			let imgWidth, imgHeight;

			if (canvasRatio > pageRatio) {
				// Изображение шире - масштабируем по ширине
				imgWidth = pageWidth - 2; // Оставляем отступы 1мм с каждой стороны
				imgHeight = imgWidth / canvasRatio;
			} else {
				// Изображение выше - масштабируем по высоте
				imgHeight = pageHeight - 2; // Оставляем отступы 1мм сверху и снизу
				imgWidth = imgHeight * canvasRatio;
			}

			// Центрируем изображение на странице
			const x = (pageWidth - imgWidth) / 2;
			const y = (pageHeight - imgHeight) / 2;

			// Добавляем изображение только на одну страницу
			pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

			pdf.save('плакат-москва.pdf');
		} catch (error) {
			console.error('Ошибка при создании PDF:', error);
			alert('Произошла ошибка при создании PDF файла');

			// Убираем классы в случае ошибки
			const posterElement = document.querySelector('.moscow-poster-container');
			if (posterElement) {
				posterElement.classList.remove('pdf-export-mode');
				const dateElements = posterElement.querySelectorAll('.poster-date-underline');
				dateElements.forEach((el) => {
					el.classList.remove('pdf-export-mode');
				});
			}
		}
	};

	// Функция для экспорта в PNG высокого качества
	const handleExportPNG = async () => {
		const element = document.getElementById('moscow-poster');

		if (!element) {
			alert('Элемент плаката не найден!');
			return;
		}

		try {
			// Временно добавляем классы для экспорта в PNG
			const dateElements = element.querySelectorAll('.poster-date-underline');
			const posterContainer = element.querySelector('.moscow-poster-container');

			if (posterContainer) {
				posterContainer.classList.add('export-mode');
			}

			dateElements.forEach((el) => {
				el.classList.add('export-mode');
			});

			// Создаем canvas с высоким разрешением для качественной печати
			const canvas = await html2canvas(element, {
				scale: 2, // Высокое разрешение для качественной печати
				useCORS: true,
				allowTaint: true,
				backgroundColor: '#ffffff',
				width: element.offsetWidth,
				height: element.offsetHeight,
			});

			// Убираем временные классы
			if (posterContainer) {
				posterContainer.classList.remove('export-mode');
			}
			dateElements.forEach((el) => {
				el.classList.remove('export-mode');
			});

			// Создаем ссылку для скачивания
			const link = document.createElement('a');
			link.download = 'плакат-москва.png';
			link.href = canvas.toDataURL('image/png');

			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (error) {
			console.error('Ошибка при экспорте PNG:', error);
			alert('Ошибка при создании PNG: ' + (error instanceof Error ? error.message : String(error)));

			// Убираем классы в случае ошибки
			const posterContainer = element.querySelector('.moscow-poster-container');
			const dateElements = element.querySelectorAll('.poster-date-underline');

			if (posterContainer) {
				posterContainer.classList.remove('export-mode');
			}
			dateElements.forEach((el) => {
				el.classList.remove('export-mode');
			});
		}
	};

	return (
		<div className="space-y-6">
			<Card className="glass-card card-hover shadow-lg">
				<CardHeader>
					<div className="flex items-center gap-2">
						<FileText className="h-5 w-5 text-primary" />
						<CardTitle>Генератор плакатов</CardTitle>
					</div>
					<CardDescription>Создание плакатов для собраний собственников</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex gap-8">
						{/* Форма */}
						<div className="w-1/3">
							<Card>
								<CardHeader>
									<div className="flex items-center justify-between">
										<CardTitle>Параметры объявления</CardTitle>
										<Button
											variant="outline"
											size="sm"
											onClick={resetAllFields}
											className="text-gray-600 hover:text-gray-800"
										>
											<RotateCcw className="w-4 h-4" />
										</Button>
									</div>
								</CardHeader>
								<CardContent className="space-y-6">
									{/* Первый день */}
									<div className="space-y-4">
										<h3 className="font-semibold">Первый день</h3>
										<div>
											<Label htmlFor="date1">Дата</Label>
											<div className="flex gap-2">
												<Input
													id="date1"
													type="date"
													value={dates.first.isoDate}
													onChange={(e) => handleDateChange(e.target.value, 'first')}
													onPaste={(e) => handleDatePaste(e, 'first')}
													className="flex-1"
												/>
												{(dates.first.date || dates.first.timeStart || dates.first.timeEnd) && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => clearDateAndTime('first')}
														className="w-10 h-10 p-0"
													>
														<X className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="time1Start">Время начала</Label>
												<div className="flex gap-2">
													<Input
														id="time1Start"
														type="time"
														value={dates.first.timeStart}
														onChange={(e) => setDates(prev => ({
															...prev,
															first: { ...prev.first, timeStart: e.target.value }
														}))}
														className="flex-1"
													/>
													<Select onValueChange={(value) => handleQuickTimeSelect('first', 'start', value)}>
														<SelectTrigger className="w-20">
															<Clock className="w-4 h-4" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="15:00">15:00</SelectItem>
															<SelectItem value="15:30">15:30</SelectItem>
															<SelectItem value="16:00">16:00</SelectItem>
															<SelectItem value="16:30">16:30</SelectItem>
															<SelectItem value="17:00">17:00</SelectItem>
															<SelectItem value="17:30">17:30</SelectItem>
															<SelectItem value="18:00">18:00</SelectItem>
															<SelectItem value="18:30">18:30</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<div>
												<Label htmlFor="time1End">Время окончания</Label>
												<div className="flex gap-2">
													<Input
														id="time1End"
														type="time"
														value={dates.first.timeEnd}
														onChange={(e) => setDates(prev => ({
															...prev,
															first: { ...prev.first, timeEnd: e.target.value }
														}))}
														className="flex-1"
													/>
													<Select onValueChange={(value) => handleQuickTimeSelect('first', 'end', value)}>
														<SelectTrigger className="w-20">
															<Clock className="w-4 h-4" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="18:00">18:00</SelectItem>
															<SelectItem value="18:30">18:30</SelectItem>
															<SelectItem value="19:00">19:00</SelectItem>
															<SelectItem value="19:30">19:30</SelectItem>
															<SelectItem value="20:00">20:00</SelectItem>
															<SelectItem value="20:30">20:30</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>
									</div>

									{/* Второй день */}
									<div className="space-y-4">
										<h3 className="font-semibold">Второй день</h3>
										<div>
											<Label htmlFor="date2">Дата</Label>
											<div className="flex gap-2">
												<Input
													id="date2"
													type="date"
													value={dates.second.isoDate}
													onChange={(e) => handleDateChange(e.target.value, 'second')}
													onPaste={(e) => handleDatePaste(e, 'second')}
													className="flex-1"
												/>
												{(dates.second.date || dates.second.timeStart || dates.second.timeEnd) && (
													<Button
														variant="outline"
														size="sm"
														onClick={() => clearDateAndTime('second')}
														className="w-10 h-10 p-0"
													>
														<X className="w-4 h-4" />
													</Button>
												)}
											</div>
										</div>
										<div className="grid grid-cols-2 gap-4">
											<div>
												<Label htmlFor="time2Start">Время начала</Label>
												<div className="flex gap-2">
													<Input
														id="time2Start"
														type="time"
														value={dates.second.timeStart}
														onChange={(e) => setDates(prev => ({
															...prev,
															second: { ...prev.second, timeStart: e.target.value }
														}))}
														className="flex-1"
													/>
													<Select onValueChange={(value) => handleQuickTimeSelect('second', 'start', value)}>
														<SelectTrigger className="w-20">
															<Clock className="w-4 h-4" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="15:00">15:00</SelectItem>
															<SelectItem value="15:30">15:30</SelectItem>
															<SelectItem value="16:00">16:00</SelectItem>
															<SelectItem value="16:30">16:30</SelectItem>
															<SelectItem value="17:00">17:00</SelectItem>
															<SelectItem value="17:30">17:30</SelectItem>
															<SelectItem value="18:00">18:00</SelectItem>
															<SelectItem value="18:30">18:30</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
											<div>
												<Label htmlFor="time2End">Время окончания</Label>
												<div className="flex gap-2">
													<Input
														id="time2End"
														type="time"
														value={dates.second.timeEnd}
														onChange={(e) => setDates(prev => ({
															...prev,
															second: { ...prev.second, timeEnd: e.target.value }
														}))}
														className="flex-1"
													/>
													<Select onValueChange={(value) => handleQuickTimeSelect('second', 'end', value)}>
														<SelectTrigger className="w-20">
															<Clock className="w-4 h-4" />
														</SelectTrigger>
														<SelectContent>
															<SelectItem value="18:00">18:00</SelectItem>
															<SelectItem value="18:30">18:30</SelectItem>
															<SelectItem value="19:00">19:00</SelectItem>
															<SelectItem value="19:30">19:30</SelectItem>
															<SelectItem value="20:00">20:00</SelectItem>
															<SelectItem value="20:30">20:30</SelectItem>
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>
									</div>

									{/* Телефон */}
									<div className="space-y-4">
										<h3 className="font-semibold">Контактная информация</h3>
										<div className="flex items-center space-x-2">
											<Checkbox
												id="showPhone"
												checked={showPhone}
												onCheckedChange={(checked) => setShowPhone(checked as boolean)}
											/>
											<Label htmlFor="showPhone">Показывать телефон</Label>
										</div>
										{showPhone && (
											<div>
												<Label htmlFor="phone">Телефон</Label>
												<Input
													id="phone"
													type="tel"
													value={phone}
													onChange={(e) => setPhone(e.target.value)}
													placeholder="8 (499) 652-62-11"
												/>
											</div>
										)}
									</div>

									{/* Кнопки экспорта */}
									<div className="space-y-4">
										<h3 className="font-semibold">Экспорт</h3>
										<div className="grid grid-cols-2 gap-3">
											<Button onClick={handleExportPNG} variant="outline">
												<Download className="w-4 h-4 mr-2" />
												PNG
											</Button>
											<Button onClick={handleExportPDF} className="gradient-bg border-0">
												<Download className="w-4 h-4 mr-2" />
												PDF
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Предпросмотр */}
						<div className="w-2/3">
							<Card>
								<CardHeader>
									<CardTitle>Предпросмотр плаката</CardTitle>
								</CardHeader>
								<CardContent>
									<div className="flex justify-center">
										{/* Принудительная светлая тема для плаката */}
										<div className="light">
											<div id="moscow-poster" className="moscow-poster-container">
												<MoscowPoster dates={dates} phone={phone} showPhone={showPhone} />
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
} 