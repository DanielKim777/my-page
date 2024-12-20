document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');
    const undoButton = document.getElementById('undoButton');
    const redoButton = document.getElementById('redoButton');
    const exportButton = document.getElementById('exportButton');
    const fileFormatSelect = document.getElementById('fileFormatSelect');
    const status = document.getElementById('status');
    const transcript = document.getElementById('transcript');
    const scheduleBody = document.getElementById('scheduleBody');
    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const editSubject = document.getElementById('editSubject');
    const editDay = document.getElementById('editDay');
    const editStartTime = document.getElementById('editStartTime');
    const editEndTime = document.getElementById('editEndTime');
    const deleteButton = document.getElementById('deleteButton');
    const cancelButton = document.getElementById('cancelButton');
    const voiceFeedback = document.getElementById('voiceFeedback');
    const recognitionCheck = document.getElementById('recognitionCheck');
    const languageSelect = document.getElementById('languageSelect');

    // Language translations
    const translations = {
        en: {
            pageTitle: "Hogwarts Schedule Maker",
            startButton: "Start Voice Recognition",
            resetButton: "Reset Schedule",
            undoButton: "Undo",
            redoButton: "Redo",
            exportButton: "Export as Image",
            instructions: "Use voice commands to input your schedule. For example: \"Monday 9 AM to 11 AM Potions\"",
            status: "Voice recognition ready...",
            editModalTitle: "Edit Schedule",
            editSubjectLabel: "Subject:",
            editDayLabel: "Day:",
            editStartTimeLabel: "Start Time:",
            editEndTimeLabel: "End Time:",
            updateButton: "Update",
            deleteButton: "Delete",
            cancelButton: "Cancel",
            days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
            voiceCommandExamplesTitle: "Voice Command Examples",
            voiceCommandExamples: [
                {
                    category: "Add Schedule",
                    commands: [
                        "Monday 9 AM to 11 AM Potions",
                        "Tuesday 2 PM to 4 PM Transfiguration",
                        "Wednesday 10:30 AM to 12:30 PM Charms",
                        "Thursday 3 PM to 5 PM Defense Against the Dark Arts",
                        "Friday 1 PM to 3 PM Herbology"
                    ]
                },
                {
                    category: "Edit Schedule",
                    commands: [
                        "Edit Monday Potions",
                        "Delete Tuesday Transfiguration"
                    ]
                },
                {
                    category: "Reset Schedule",
                    commands: [
                        "Reset schedule"
                    ]
                },
                {
                    category: "Undo/Redo",
                    commands: [
                        "Undo",
                        "Redo"
                    ]
                },
                {
                    category: "Export Schedule",
                    commands: [
                        "Export schedule",
                        "Export as Image"
                    ]
                }
            ]
        },
        ko: {
            pageTitle: "호그와트 시간표 생성기",
            startButton: "음성 인식 시작",
            resetButton: "시간표 초기화",
            undoButton: "되돌리기",
            redoButton: "다시 실행",
            exportButton: "이미지로 내보내기",
            instructions: "음성으로 시간표를 입력하세요. 예: \"월요일 오전 9시부터 11시까지 마법약 수업\"",
            status: "음성 인식 준비 중...",
            editModalTitle: "일정 수정",
            editSubjectLabel: "과목:",
            editDayLabel: "요일:",
            editStartTimeLabel: "시작 시간:",
            editEndTimeLabel: "종료 시간:",
            updateButton: "수정",
            deleteButton: "삭제",
            cancelButton: "취소",
            days: ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'],
            voiceCommandExamplesTitle: "음성 명령어 예시",
            voiceCommandExamples: [
                {
                    category: "스케줄 추가",
                    commands: [
                        "월요일 오전 9시부터 11시까지 마법약 수업",
                        "화요일 오후 2시부터 4시까지 변신술",
                        "수요일 오전 10시 30분부터 오후 12시 30분까지 마법 주문",
                        "목요일 오후 3시부터 5시까지 어둠의 마법 방어술",
                        "금요일 오후 1시부터 3시까지 약초학"
                    ]
                },
                {
                    category: "스케줄 편집",
                    commands: [
                        "월요일 마법약 수정",
                        "화요일 변신술 삭제"
                    ]
                },
                {
                    category: "스케줄 초기화",
                    commands: [
                        "시간표 초기화"
                    ]
                },
                {
                    category: "실행 취소/다시 실행",
                    commands: [
                        "되돌리기",
                        "다시 실행"
                    ]
                },
                {
                    category: "스케줄 내보내기",
                    commands: [
                        "시간표 내보내기",
                        "이미지로 내보내기"
                    ]
                }
            ]
        }
    };

    let currentLanguage = 'en';
    let days = translations[currentLanguage].days;
    const hours = Array.from({length: 14}, (_, i) => i + 8); // 8 AM to 9 PM

    // Voice recognition and speech synthesis variables
    let recognition;
    let isListening = false;
    let speechSynthesis = window.speechSynthesis;

    // Variables for managing subject colors
    const subjectColors = new Map();
    const colors = [
        '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF',
        '#F0E68C', '#DDA0DD', '#E6E6FA', '#FFA07A', '#98FB98'
    ];
    let colorIndex = 0;

    // Variables for managing undo/redo functionality
    const stateHistory = [];
    let currentStateIndex = -1;

    // Variable to store the currently editing schedule element
    let currentEditingElement = null;

    // Create initial schedule grid
    createScheduleGrid();

    function formatTo12Hour(hour) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const adjustedHour = hour % 12 || 12;
        return `${adjustedHour}${period}`;
    }

    function createScheduleGrid() {
        scheduleBody.innerHTML = '';
        hours.forEach(hour => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${formatTo12Hour(hour)}</td>${'<td></td>'.repeat(7)}`;
            scheduleBody.appendChild(row);
        });
        saveState();
    }

    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            const current = event.resultIndex;
            const transcriptText = event.results[current][0].transcript;
            const statusMessage = currentLanguage === 'en' ? 'Detected speech: ' : '감지된 음성: ';
            transcript.textContent = `${statusMessage}${transcriptText}`;
            if (event.results[current].isFinal) {
                handleVoiceCommand(transcriptText);
                showRecognitionCheck();
            }
        };

        recognition.onnomatch = () => {
            status.textContent = currentLanguage === 'en' ? 'Listening...' : '듣는 중...';
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error', event.error);
            // Only update the status for errors that should be visible to the user
            if (event.error === 'no-speech' || event.error === 'audio-capture' || event.error === 'not-allowed') {
                status.textContent = currentLanguage === 'en' ? 'Could not detect speech. Please try again.' : '음성을 감지할 수 없습니다. 다시 시도해주세요.';
            }
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start();
            }
        };
    } else {
        startButton.disabled = true;
        status.textContent = currentLanguage === 'en' ? 'Speech recognition is not supported in this browser.' : '이 브라우저는 음성 인식을 지원하지 않습니다.';
    }

    startButton.addEventListener('click', toggleSpeechRecognition);
    resetButton.addEventListener('click', resetSchedule);
    undoButton.addEventListener('click', undo);
    redoButton.addEventListener('click', redo);
    exportButton.addEventListener('click', exportScheduleAsImage);
    languageSelect.addEventListener('change', (e) => {
        currentLanguage = e.target.value;
        updateLanguage();
    });

    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        updateScheduleItem();
        closeModal();
    });

    deleteButton.addEventListener('click', () => {
        if (confirm(currentLanguage === 'en' ? 'Are you sure you want to delete this schedule item?' : '이 일정을 삭제하시겠습니까?')) {
            currentEditingElement.parentNode.removeChild(currentEditingElement);
            closeModal();
            saveState();
        }
    });

    cancelButton.addEventListener('click', closeModal);

    function updateLanguage() {
        const t = translations[currentLanguage];
        days = t.days;

        document.getElementById('pageTitle').textContent = t.pageTitle;
        startButton.textContent = t.startButton;
        resetButton.textContent = t.resetButton;
        undoButton.textContent = t.undoButton;
        redoButton.textContent = t.redoButton;
        exportButton.textContent = t.exportButton;
        document.getElementById('instructions').textContent = t.instructions;
        status.textContent = currentLanguage === 'en' ? 'Ready for voice input' : '음성 입력 준비됨';
        document.getElementById('editModalTitle').textContent = t.editModalTitle;
        document.getElementById('editSubjectLabel').textContent = t.editSubjectLabel;
        document.getElementById('editDayLabel').textContent = t.editDayLabel;
        document.getElementById('editStartTimeLabel').textContent = t.editStartTimeLabel;
        document.getElementById('editEndTimeLabel').textContent = t.editEndTimeLabel;
        document.getElementById('updateButton').textContent = t.updateButton;
        deleteButton.textContent = t.deleteButton;
        cancelButton.textContent = t.cancelButton;

        // Update day options in edit modal
        const editDaySelect = document.getElementById('editDay');
        editDaySelect.innerHTML = '';
        t.days.forEach((day, index) => {
            const option = document.createElement('option');
            option.value = t.days[index];
            option.textContent = day;
            editDaySelect.appendChild(option);
        });

        // Update table header
        const tableHeader = document.querySelector('#scheduleTable thead tr');
        tableHeader.innerHTML = '<th></th>';
        t.days.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            tableHeader.appendChild(th);
        });

        // Update voice recognition language
        if (recognition) {
            recognition.lang = currentLanguage === 'en' ? 'en-US' : 'ko-KR';
        }

        // Update speech synthesis language
        if (speechSynthesis) {
            speechSynthesis.cancel();
        }

        // Update voice command examples
        const voiceCommandExamplesTitle = document.getElementById('voiceCommandExamplesTitle');
        const voiceCommandList = document.getElementById('voiceCommandList');
        
        voiceCommandExamplesTitle.textContent = t.voiceCommandExamplesTitle;
        voiceCommandList.innerHTML = '';
        t.voiceCommandExamples.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'voice-command-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.category;
            categoryDiv.appendChild(categoryTitle);
            
            const commandList = document.createElement('ul');
            commandList.className = 'voice-command-list';
            
            category.commands.forEach(command => {
                const li = document.createElement('li');
                li.textContent = command;
                commandList.appendChild(li);
            });
            
            categoryDiv.appendChild(commandList);
            voiceCommandList.appendChild(categoryDiv);
        });
    }

    function toggleSpeechRecognition() {
        if (!isListening) {
            recognition.start();
            isListening = true;
            startButton.textContent = translations[currentLanguage].startButton === "Start Voice Recognition" ? "Stop Voice Recognition" : "음성 인식 중지";
            status.textContent = currentLanguage === 'en' ? 'Listening...' : '듣는 중...';
            speak(currentLanguage === 'en' ? 'Voice recognition started. Please state your command.' : '음성 인식을 시작합니다. 명령을 말씀해 주세요.');
        } else {
            recognition.stop();
            isListening = false;
            startButton.textContent = translations[currentLanguage].startButton;
            status.textContent = currentLanguage === 'en' ? 'Voice recognition stopped' : '음성 인식 중지됨';
            speak(currentLanguage === 'en' ? 'Voice recognition stopped.' : '음성 인식을 중지합니다.');
        }
    }

    function resetSchedule() {
        createScheduleGrid();
        subjectColors.clear();
        colorIndex = 0;
        saveState();
        speak(currentLanguage === 'en' ? 'Schedule has been reset.' : '시간표가 초기화되었습니다.');
    }

    function undo() {
        if (currentStateIndex > 0) {
            currentStateIndex--;
            restoreState(stateHistory[currentStateIndex]);
            speak(currentLanguage === 'en' ? 'Undone.' : '되돌렸습니다.');
        } else {
            speak(currentLanguage === 'en' ? 'Cannot undo further.' : '더 이상 되돌릴 수 없습니다.');
        }
    }

    function redo() {
        if (currentStateIndex < stateHistory.length - 1) {
            currentStateIndex++;
            restoreState(stateHistory[currentStateIndex]);
            speak(currentLanguage === 'en' ? 'Redone.' : '다시 실행했습니다.');
        } else {
            speak(currentLanguage === 'en' ? 'Cannot redo further.' : '더 이상 다시 실행할 수 없습니다.');
        }
    }

    function handleVoiceCommand(command) {
        if (command.toLowerCase().includes(currentLanguage === 'en' ? 'edit' : '수정')) {
            editScheduleByVoice(command);
        } else if (command.toLowerCase().includes(currentLanguage === 'en' ? 'delete' : '삭제')) {
            deleteScheduleByVoice(command);
        } else if (command.toLowerCase().includes(currentLanguage === 'en' ? 'export' : '내보내기') || 
                   command.toLowerCase().includes(currentLanguage === 'en' ? 'save' : '저장')) {
            exportScheduleAsImage();
        } else if (command.toLowerCase().includes(currentLanguage === 'en' ? 'reset' : '초기화')) {
            resetSchedule();
        } else if (command.toLowerCase().includes(currentLanguage === 'en' ? 'undo' : '되돌리기')) {
            undo();
        } else if (command.toLowerCase().includes(currentLanguage === 'en' ? 'redo' : '다시 실행')) {
            redo();
        } else {
            parseSchedule(command);
        }
    }

    function parseSchedule(text) {
        const regex = currentLanguage === 'en' 
            ? /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(\d{1,2})(?::(\d{2}))?\s*((?:a\.m\.|p\.m\.)|(?:AM|PM))?\s*(?:to|until)?\s*(\d{1,2})(?::(\d{2}))?\s*((?:a\.m\.|p\.m\.)|(?:AM|PM))?\s*(.*)/gi
            : /(월요일|화요일|수요일|목요일|금요일|토요일|일요일)\s+(오전|오후)?\s*(\d{1,2})시\s*(\d{1,2})?분?\s*(?:부터)?\s*(오전|오후)?\s*(\d{1,2})시\s*(\d{1,2})?분?\s*(?:까지)?\s*(.*)/g;

        const matches = Array.from(text.matchAll(regex));

        if (matches.length === 0) {
            speak(currentLanguage === 'en' ? 'Could not recognize the schedule. Please try again.' : '일정을 인식할 수 없습니다. 다시 시도해주세요.');
            return;
        }

        matches.forEach(match => {
            if (currentLanguage === 'en') {
                const [, day, startHour, startMinute, startPeriod, endHour, endMinute, endPeriod, subject] = match;
                addScheduleItem(
                    day, 
                    convertTo24Hour(parseInt(startHour), startPeriod), parseInt(startMinute) || 0,
                    convertTo24Hour(parseInt(endHour), endPeriod), parseInt(endMinute) || 0,
                    subject.trim() || 'Untitled'
                );
            } else {
                const [, day, startPeriod, startHour, startMinute, endPeriod, endHour, endMinute, subject] = match;
                addScheduleItem(
                    day, 
                    convertTo24Hour(parseInt(startHour), startPeriod), parseInt(startMinute) || 0,
                    convertTo24Hour(parseInt(endHour), endPeriod), parseInt(endMinute) || 0, 
                    subject.trim() || '과목 미지정'
                );
            }
        });

        speak(currentLanguage === 'en' ? 'Schedule item added.' : '일정이 추가되었습니다.');
    }

    function convertTo24Hour(hour, period) {
        if (currentLanguage === 'en') {
            if (period) {
                const upperPeriod = period.toUpperCase();
                if ((upperPeriod === 'PM' || upperPeriod === 'P.M.') && hour !== 12) {
                    return hour + 12;
                } else if ((upperPeriod === 'AM' || upperPeriod === 'A.M.') && hour === 12) {
                    return 0;
                }
            }
        } else {
            if (period === '오후' && hour !== 12) {
                return hour + 12;
            } else if (period === '오전' && hour === 12) {
                return 0;
            }
        }
        return hour;
    }

    function addScheduleItem(day, startHour, startMinute, endHour, endMinute, subject) {
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return;

        // Convert start and end times to decimal
        const startTime = startHour + startMinute / 60;
        const endTime = endHour + endMinute / 60;
        const duration = endTime - startTime;

        // Check for invalid time input
        if (startTime >= endTime || startHour < 8 || endHour > 21) {
            speak(currentLanguage === 'en' ?
                'Invalid time input. Please try again.' : '잘못된 시간 입력입니다. 다시 시도해주세요.');
            return;
        }

        // Check for overlapping schedules
        if (isOverlapping(dayIndex, startTime, endTime)) {
            speak(currentLanguage === 'en' ?
                'This schedule overlaps with an existing item. Please try again.' :
                '이미 존재하는 일정과 겹칩니다. 다시 시도해주세요.');
            alert(currentLanguage === 'en' ?
                'This schedule overlaps with an existing item. Please try again.' :
                '이미 존재하는 일정과 겹칩니다. 다시 시도해주세요.');
            return;
        }

        // Create and style the schedule element
        const subjectElement = document.createElement('div');
        subjectElement.className = 'subject';

        // Set subject and time text
        const subjectText = document.createElement('div');
        subjectText.className = 'subject-text';
        subjectText.textContent = subject;

        const timeText = document.createElement('div');
        timeText.className = 'time-text';
        timeText.textContent = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

        subjectElement.appendChild(subjectText);
        subjectElement.appendChild(timeText);

        // Set tooltip
        const fullText = `${subject}
${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')} - ${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        subjectElement.title = fullText;

        // Assign color to subject
        const backgroundColor = subjectColors.get(subject) || colors[colorIndex];
        subjectColors.set(subject, backgroundColor);
        colorIndex = (colorIndex + 1) % colors.length;
        subjectElement.style.backgroundColor = backgroundColor;

        // Add this code to determine text color based on background brightness
        const rgb = parseInt(backgroundColor.slice(1), 16);
        const r = (rgb >> 16) & 0xff;
        const g = (rgb >>  8) & 0xff;
        const b = (rgb >>  0) & 0xff;
        const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        subjectElement.style.color = luma < 128 ? '#FFFFFF' : '#000000';

        // Set position and size of the schedule block
        const topOffset = (startTime - 8) * 100;
        const height = duration * 100;
        subjectElement.style.position = 'absolute';
        subjectElement.style.top = `${topOffset}%`;
        subjectElement.style.height = `${height}%`;
        subjectElement.style.left = '0';
        subjectElement.style.right = '0';
        subjectElement.style.zIndex = '10';

        // Adjust font size based on duration
        if (duration <= 0.5) { // 30 minutes or less
            const baseFontSize = 14; // Base font size for items over 30 minutes
            const scaleFactor = duration / 0.5; // Scale factor based on duration (0.5 hours = 30 minutes)
            const fontSize = Math.max(8, Math.round(baseFontSize * scaleFactor)); // Minimum font size of 8px
            subjectElement.style.fontSize = `${fontSize}px`;
        }

        // Add to the schedule
        const cell = scheduleBody.rows[0].cells[dayIndex + 1];
        cell.appendChild(subjectElement);

        // Add click event for editing
        subjectElement.addEventListener('click', () => {
            openEditModal(subjectElement, day, startHour, startMinute, endHour, endMinute, subject);
        });

        saveState();
    }

    function editScheduleByVoice(command) {
        const regex = currentLanguage === 'en'
            ? /edit\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(.*)/i
            : /(월요일|화요일|수요일|목요일|금요일|토요일|일요일)\s+(.*)\s+수정/;

        const match = command.match(regex);

        if (match) {
            const [, day, subject] = match;
            const scheduleItem = findScheduleItemByDayAndSubject(day, subject);

            if (scheduleItem) {
                const [startHour, startMinute, endHour, endMinute] = getScheduleItemTimes(scheduleItem);
                openEditModal(scheduleItem, day, startHour, startMinute, endHour, endMinute, subject);
                speak(currentLanguage === 'en' ? 'Ready to edit the schedule. Please fill in the form on the screen.' : '일정을 수정할 준비가 되었습니다. 화면의 양식을 채워주세요.');
            } else {
                speak(currentLanguage === 'en' ? 'Could not find the specified schedule item.' : '해당 일정을 찾을 수 없습니다.');
            }
        } else {
            speak(currentLanguage === 'en' ? 'Could not recognize the edit command. Please try again.' : '수정 명령을 인식할 수 없습니다. 다시 시도해주세요.');
        }
    }

    function deleteScheduleByVoice(command) {
        const regex = currentLanguage === 'en'
            ? /delete\s+(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+(.*)/i
            : /(월요일|화요일|수요일|목요일|금요일|토요일|일요일)\s+(.*)\s+삭제/;

        const match = command.match(regex);

        if (match) {
            const [, day, subject] = match;
            const scheduleItem = findScheduleItemByDayAndSubject(day, subject);

            if (scheduleItem) {
                scheduleItem.parentNode.removeChild(scheduleItem);
                saveState();
                speak(currentLanguage === 'en' ? 'Schedule item deleted.' : '일정이 삭제되었습니다.');
            } else {
                speak(currentLanguage === 'en' ? 'Could not find the specified schedule item.' : '해당 일정을 찾을 수 없습니다.');
            }
        } else {
            speak(currentLanguage === 'en' ? 'Could not recognize the delete command. Please try again.' : '삭제 명령을 인식할 수 없습니다. 다시 시도해주세요.');
        }
    }

    function findScheduleItemByDayAndSubject(day, subject) {
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return null;

        for (let i = 0; i < scheduleBody.rows.length; i++) {
            const cell = scheduleBody.rows[i].cells[dayIndex + 1];
            const subjects = cell.querySelectorAll('.subject');

            for (let subjectElement of subjects) {
                const subjectText = subjectElement.querySelector('.subject-text').textContent;
                if (subjectText.toLowerCase() === subject.toLowerCase()) {
                    return subjectElement;
                }
            }
        }

        return null;
    }

    function getScheduleItemTimes(scheduleItem) {
        const timeText = scheduleItem.querySelector('.time-text').textContent;
        const [startTime, endTime] = timeText.split(' - ');
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        return [startHour, startMinute, endHour, endMinute];
    }

    function findScheduleItem(day, startHour, startMinute, subject) {
        const dayIndex = days.indexOf(day);
        if (dayIndex === -1) return null;

        const cell = scheduleBody.rows[startHour - 8].cells[dayIndex + 1];
        const subjects = cell.querySelectorAll('.subject');

        for (let subjectElement of subjects) {
            const subjectText = subjectElement.querySelector('.subject-text').textContent;
            const timeText = subjectElement.querySelector('.time-text').textContent;
            const [itemStartTime] = timeText.split(' - ');
            const [itemStartHour, itemStartMinute] = itemStartTime.split(':').map(Number);

            if (subjectText === subject && itemStartHour === startHour && itemStartMinute === startMinute) {
                return subjectElement;
            }
        }

        return null;
    }

    function isOverlapping(dayIndex, startTime, endTime) {
        const cell = scheduleBody.rows[0].cells[dayIndex + 1]; 
        const subjects = cell.querySelectorAll('.subject');
        for (let subject of subjects) {
            const subjectStart = parseFloat(subject.style.top) / 100 + 8; 
            const subjectHeight = parseFloat(subject.style.height) / 100;
            const subjectEnd = subjectStart + subjectHeight;

            if ((startTime < subjectEnd && endTime > subjectStart) ||
                (subjectStart < endTime && subjectEnd > startTime)) {
                return true;
            }
        }
        return false;
    }

    function saveState() {
        const state =scheduleBody.innerHTML;
        stateHistory.splice(currentStateIndex + 1);
        stateHistory.push(state);
        currentStateIndex = stateHistory.length - 1;
        updateUndoRedoButtons();
    }

    function restoreState(state) {
        scheduleBody.innerHTML = state;
        attachEventListeners();
        updateUndoRedoButtons();
    }

    function updateUndoRedoButtons() {
        undoButton.disabled = currentStateIndex <= 0;
        redoButton.disabled = currentStateIndex >= stateHistory.length - 1;
    }

    function attachEventListeners() {
        const subjects = scheduleBody.querySelectorAll('.subject');
        subjects.forEach(subject => {
            subject.addEventListener('click', () => {
                const day = days[subject.closest('td').cellIndex - 1];
                const startTime = parseFloat(subject.style.top) / 100 + parseInt(subject.closest('tr').firstChild.textContent);
                const duration = parseFloat(subject.style.height) / 100;
                const endTime = startTime + duration;
                const subjectText = subject.querySelector('.subject-text').textContent;
                openEditModal(subject, day, Math.floor(startTime), Math.round((startTime % 1) * 60), Math.floor(endTime), Math.round((endTime % 1) * 60), subjectText);
            });
        });
    }

    function openEditModal(element, day, startHour, startMinute, endHour, endMinute, subject) {
        currentEditingElement = element;
        editSubject.value = subject;
        editDay.value = day;
        editStartTime.value = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        editEndTime.value = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
        editModal.style.display = 'block';
    }

    function closeModal() {
        editModal.style.display = 'none';
        currentEditingElement = null;
    }

    function updateScheduleItem() {
        const newSubject = editSubject.value;
        const newDay = editDay.value;
        const [newStartHour, newStartMinute] = editStartTime.value.split(':').map(Number);
        const [newEndHour, newEndMinute] = editEndTime.value.split(':').map(Number);

        // Remove existing schedule item
        currentEditingElement.parentNode.removeChild(currentEditingElement);

        // Add updated schedule item
        addScheduleItem(newDay, newStartHour, newStartMinute, newEndHour, newEndMinute, newSubject);
        speak(currentLanguage === 'en' ? 'Schedule item updated.' : '일정이 수정되었습니다.');
    }

    function exportScheduleAsImage() {
        const format = fileFormatSelect.value;
        
        html2canvas(document.querySelector("#scheduleTable"), {
            backgroundColor: null,
            scale: 2
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `schedule.${format}`;
            if (format === 'png') {
                link.href = canvas.toDataURL('image/png');

            } else if (format === 'webp') {
                link.href = canvas.toDataURL('image/webp');
            }
            link.click();
            speak(currentLanguage === 'en' ? 'Schedule has been saved as an image.' : '시간표가 이미지로 저장되었습니다.');
        });
    }

    function showRecognitionCheck() {
        recognitionCheck.classList.remove('hidden');
        setTimeout(() => {
            recognitionCheck.classList.add('hidden');
        }, 2000);
    }

    function speak(text) {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = currentLanguage === 'en' ? 'en-US' : 'ko-KR';
        speechSynthesis.speak(utterance);
        voiceFeedback.textContent = text;
    }

    // Call updateLanguage initially to set the correct language
    updateLanguage();
});

