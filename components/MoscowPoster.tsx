import React from "react";
import Image from "next/image";

interface DateInfo {
	date: string;
	isoDate: string;
	timeStart: string;
	timeEnd: string;
}

interface TextContentProps {
	dates: {
		first: DateInfo;
		second?: DateInfo;
	};
	phone: string;
	showPhone: boolean;
}

export default function MoscowPoster({ dates, phone, showPhone }: TextContentProps) {
	// Проверяем, идут ли даты подряд
	const areDatesConsecutive = (date1: string, date2: string) => {
		const [day1, month1] = date1.toLowerCase().split(' ');
		const [day2, month2] = date2.toLowerCase().split(' ');
		if (month1 !== month2) return false;
		return parseInt(day2) - parseInt(day1) === 1;
	};

	// Проверяем, одинаковое ли время
	const isSameTime = () => {
		if (!dates.second) return false;
		const secondTimeStart = dates.second.timeStart || dates.first.timeStart;
		const secondTimeEnd = dates.second.timeEnd || dates.first.timeEnd;
		return dates.first.timeStart === secondTimeStart &&
			dates.first.timeEnd === secondTimeEnd;
	};

	// Проверяем, есть ли вторая дата (не пустая)
	const hasSecondDate = () => {
		return dates.second &&
			dates.second.date &&
			dates.second.date.trim() !== "";
	};

	// Получаем время для второй даты (если не указано, используем время первой)
	const getSecondDateTime = () => {
		if (!dates.second) return { timeStart: '', timeEnd: '' };
		return {
			timeStart: dates.second.timeStart || dates.first.timeStart,
			timeEnd: dates.second.timeEnd || dates.first.timeEnd
		};
	};

	// Получаем правильный текст в зависимости от количества дат
	const getEventText = () => {
		const hasMultipleDates = hasSecondDate();
		if (hasMultipleDates) {
			return "состоятся поквартирные обходы";
		} else {
			return "состоится поквартирный обход";
		}
	};

	// Проверяем, одинаковый ли месяц у двух дат
	const isSameMonth = (date1: string, date2: string) => {
		const [, month1] = date1.toLowerCase().split(' ');
		const [, month2] = date2.toLowerCase().split(' ');
		return month1 === month2;
	};

	// Форматируем даты для одного месяца
	const formatSameMonthDates = (date1: string, date2: string) => {
		const [day1, month1] = date1.toLowerCase().split(' ');
		const [day2] = date2.toLowerCase().split(' ');

		if (areDatesConsecutive(date1, date2)) {
			return `${day1}-${day2} ${month1}`;
		} else {
			return `${day1} и ${day2} ${month1}`;
		}
	};

	// Генерируем контент для дат
	const generateDateContent = () => {
		// Если есть вторая дата и время одинаковое (или у второй даты не указано время)
		if (hasSecondDate() && isSameTime()) {
			const timeStr = `с ${dates.first.timeStart} до ${dates.first.timeEnd}`;

			// Проверяем, одинаковый ли месяц
			const sameMonth = isSameMonth(dates.first.date, dates.second!.date);
			let displayText;

			if (sameMonth) {
				// Если месяц одинаковый, используем оптимизированный формат
				displayText = formatSameMonthDates(dates.first.date, dates.second!.date);
			} else {
				// Если месяцы разные, отображаем как раньше
				if (areDatesConsecutive(dates.first.date, dates.second!.date)) {
					displayText = `${dates.first.date.toLowerCase()}-${dates.second!.date.toLowerCase()}`;
				} else {
					displayText = `${dates.first.date.toLowerCase()} и ${dates.second!.date.toLowerCase()}`;
				}
			}

			return (
				<div
					className="absolute flex flex-col items-center"
					style={{
						width: '400px',
						left: '97px',
						top: '240px'
					}}
				>
					<div className="flex justify-center">
						<div className="font-bold text-[36px] leading-[44px] whitespace-nowrap relative poster-date-underline">
							{displayText}
						</div>
					</div>
					<div
						className="flex justify-center text-[34px] leading-[41px] whitespace-nowrap same-time"
						style={{
							marginTop: '20px'
						}}
					>
						{timeStr}
					</div>
				</div>
			);
		}

		// Если только одна дата
		if (!hasSecondDate()) {
			return (
				<div
					className="absolute flex flex-col items-center"
					style={{
						width: '400px',
						left: '97px',
						top: '240px'
					}}
				>
					<div className="flex justify-center">
						<div className="font-bold text-[36px] leading-[44px] whitespace-nowrap relative poster-date-underline">
							{dates.first.date.toLowerCase()}
						</div>
					</div>
					<div
						className="flex justify-center text-[34px] leading-[41px] whitespace-nowrap single-date-time"
						style={{
							marginTop: '20px'
						}}
					>
						с {dates.first.timeStart} до {dates.first.timeEnd}
					</div>
				</div>
			);
		} else {
			// Если время разное (и у второй даты указано свое время)
			const secondTime = getSecondDateTime();

			return (
				<>
					{/* Контейнер для центрирования */}
					<div
						className="absolute"
						style={{
							width: '350px',
							left: '122px',
							top: '220px'
						}}
					>
						{/* Первая дата */}
						<div className="flex justify-center">
							<div
								className="font-bold text-[36px] leading-[44px] relative"
								style={{
									height: '26px',
								}}
							>
								<div className="whitespace-nowrap relative poster-date-underline">
									{dates.first.date}
								</div>
							</div>
						</div>

						{/* Первое время */}
						<div
							className="flex justify-center text-[34px] leading-[41px]"
							style={{
								height: '25px',
								marginTop: '25px'
							}}
						>
							с {dates.first.timeStart} до {dates.first.timeEnd}
						</div>

						{/* Вторая дата */}
						<div
							className="flex justify-center"
							style={{
								marginTop: '20px'
							}}
						>
							<div
								className="font-bold text-[36px] leading-[44px] relative"
								style={{
									height: '26px',
								}}
							>
								<div className="whitespace-nowrap relative poster-date-underline">
									{dates.second!.date}
								</div>
							</div>
						</div>

						{/* Второе время */}
						<div
							className="flex justify-center text-[34px] leading-[41px]"
							style={{
								height: '25px',
								marginTop: '25px'
							}}
						>
							с {secondTime.timeStart} до {secondTime.timeEnd}
						</div>
					</div>
				</>
			);
		}
	};

	return (
		<div className="moscow-poster-container relative w-[595.3px] h-[841.89px]">
			<div className="absolute inset-0">
				<Image
					src="/images/header-reference.png"
					alt="Шаблон объявления"
					fill
					priority
					style={{ objectFit: 'contain' }}
				/>

				{generateDateContent()}

				{/* Основной текст */}
				<div
					className="absolute w-full text-center"
					style={{
						top: (!hasSecondDate() || isSameTime()) ? '380px' : '420px'
					}}
				>
					<p
						className="text-[32px]"
						style={{
							lineHeight: (!hasSecondDate() || isSameTime()) ? '42px' : '39px'
						}}
					>
						{getEventText().charAt(0).toUpperCase() + getEventText().slice(1)}
						<br />
						сотрудниками платформы
						<br />
						Правительства Москвы
						<br />
						<span className="font-bold">«Электронный дом»</span>
						<br />
						с целью <span className="font-bold">сбора бюллетеней</span> в
						<br />
						рамках голосования на
						<br />
						<span className="font-bold">общем собрании собственников</span>
					</p>
				</div>

				{/* Телефон - показываем только если включен чекбокс */}
				{showPhone && (
					<div className="absolute w-[450px] left-[72.65px] top-[730.5px] text-center">
						<p className="text-[22px] leading-[27px]">
							По всем вопросам обращайтесь по телефону:{" "}
							<span className="font-bold">{phone}</span>
						</p>
					</div>
				)}
			</div>
		</div>
	);
} 