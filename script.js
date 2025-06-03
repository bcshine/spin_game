// 룰렛 게임 로직을 관리하는 SushiRoulette 클래스 정의 시작
class SushiRoulette {
    // 생성자 함수: 룰렛 객체가 생성될 때 초기 설정을 담당
    constructor() {
        // HTML에서 id가 'wheelCanvas'인 canvas 요소를 가져와서 this.canvas에 할당
        this.canvas = document.getElementById('wheelCanvas');
        // canvas 요소의 2D 렌더링 컨텍스트를 가져와서 this.ctx에 할당 (그림 그리기용)
        this.ctx = this.canvas.getContext('2d');
        // HTML에서 id가 'spinButton'인 button 요소를 가져와서 this.spinButton에 할당
        this.spinButton = document.getElementById('spinButton');
        // HTML에서 id가 'resultText'인 p 요소를 가져와서 this.resultTextElement에 할당 (결과 표시용)
        this.resultTextElement = document.getElementById('resultText');

        // 룰렛판의 각 구획(segment)에 대한 정보를 배열로 정의
        this.segments = [
            { text: '연어장 2 피스', color: '#FFDAB9' }, // PeachPuff
            { text: '10% 할인', color: '#ADD8E6' },    // LightBlue
            { text: '미니샐러드', color: '#90EE90' },  // LightGreen
            { text: '음료수 한잔', color: '#FFB6C1' },  // LightPink
            { text: '무료 커피', color: '#D2B48C' },    // Tan
            { text: '꽝, 한번더!', color: '#D3D3D3' }  // LightGray
        ];

        // 룰렛판의 총 구획 수
        this.numSegments = this.segments.length;
        // 각 구획이 차지하는 각도 (라디안)
        this.segmentAngle = 2 * Math.PI / this.numSegments;
        // 룰렛의 현재 절대 회전 각도 (라디안)
        this.currentRotation = 0;
        // 회전 중인지 여부
        this.isSpinning = false;
        // 회전 시간 (5초)
        this.spinDuration = 5000;
        // 룰렛 초기화 메서드 호출
        this.init();
    }

    // 룰렛 초기화
    init() {
        // 캔버스 크기 조정
        this.adjustCanvasSize();
        // 룰렛판 그리기
        this.drawWheel();
        // 시작 버튼 이벤트 리스너 설정
        this.spinButton.addEventListener('click', () => this.spin());
        // 창 크기 변경 시 캔버스 크기 재조정 및 다시 그리기
        window.addEventListener('resize', () => {
            this.adjustCanvasSize();
            this.drawWheel();
        });
    }

    // 캔버스 크기 동적 조정
    adjustCanvasSize() {
        const container = document.querySelector('.wheel-container');
        const size = Math.min(container.offsetWidth, container.offsetHeight);
        this.canvas.width = size;
        this.canvas.height = size;
        this.radius = size / 2 - 10; // 여백 고려
    }

    // 룰렛판 그리기
    drawWheel() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        // 기준 각도를 12시 방향으로 설정 (캔버스의 0도는 3시 방향이므로 -90도 회전)
        const angleOffset = -Math.PI / 2;

        this.segments.forEach((segment, i) => {
            const startAngle = angleOffset + i * this.segmentAngle;
            const endAngle = angleOffset + (i + 1) * this.segmentAngle;

            // 세그먼트(부채꼴) 그리기
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, this.radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = segment.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff'; // 구분선
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // 텍스트 그리기
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            // 텍스트를 세그먼트 중앙으로 회전
            this.ctx.rotate(startAngle + this.segmentAngle / 2);
            this.ctx.textAlign = 'right'; // 텍스트를 반지름 안쪽으로
            this.ctx.textBaseline = 'middle'; // 세로 중앙 정렬
            this.ctx.fillStyle = '#333'; // 글자색
            // 글자 크기를 룰렛 크기에 비례하도록 설정
            const fontSize = Math.max(10, Math.min(this.radius * 0.09, 18)); 
            this.ctx.font = `bold ${fontSize}px "NEXON Lv1 Gothic OTF"`; // Nexon 폰트 적용
            // 텍스트를 반지름의 85% 위치에 그림
            this.ctx.fillText(segment.text, this.radius * 0.85, 0);
            this.ctx.restore();
        });
        
        // 중앙 원 (디자인 요소)
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, this.radius * 0.12, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#fff';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    // 현재 포인터가 가리키고 있는 세그먼트 인덱스를 계산하는 함수
    getPointerSegmentIndex() {
        // 포인터는 항상 12시 방향에 고정되어 있음
        // 룰렛의 현재 회전 각도를 고려하여 포인터가 가리키는 세그먼트를 계산
        
        const angleOffset = -Math.PI / 2; // 12시 방향을 0도로 설정 (drawWheel과 동일)
        
        // 룰렛이 회전한 만큼 포인터의 상대적 위치 계산
        // 포인터가 룰렛 좌표계에서 어느 각도를 가리키는지 계산
        let pointerAngleOnWheel = -this.currentRotation + angleOffset;
        
        // 각도를 0 ~ 2π 범위로 정규화
        pointerAngleOnWheel = (pointerAngleOnWheel % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        
        // angleOffset을 빼서 실제 세그먼트 계산용 각도로 변환
        let segmentAngle = pointerAngleOnWheel - angleOffset;
        segmentAngle = (segmentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
        
        // 해당 각도가 속하는 세그먼트 인덱스 계산
        const segmentIndex = Math.floor(segmentAngle / this.segmentAngle);
        
        // 인덱스가 범위를 벗어나지 않도록 보정
        return segmentIndex % this.numSegments;
    }

    // 초강력 화려한 폭죽 효과 - 메인 함수
    createSuperFireworks() {
        const fireworksContainer = document.createElement('div');
        fireworksContainer.className = 'super-fireworks-container';
        fireworksContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        document.body.appendChild(fireworksContainer);

        // 1단계: 대형 폭죽들 연속 폭발 (15개)
        for (let i = 0; i < 15; i++) {
            setTimeout(() => {
                this.createMegaFirework(fireworksContainer);
                this.createStarBurst(fireworksContainer);
            }, i * 150);
        }

        // 2단계: 하트 모양 폭죽들
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.createHeartFirework(fireworksContainer);
            }, 500 + i * 200);
        }

        // 3단계: 꽃잎 비 효과
        setTimeout(() => {
            this.createPetalRain(fireworksContainer);
        }, 800);

        // 4단계: 연속 스파클 효과
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createSparkleEffect(fireworksContainer);
            }, 300 + i * 100);
        }

        // 5단계: 무지개 폭죽
        setTimeout(() => {
            this.createRainbowFirework(fireworksContainer);
        }, 1200);

        // 6초 후 모든 효과 정리
        setTimeout(() => {
            if (fireworksContainer.parentNode) {
                fireworksContainer.parentNode.removeChild(fireworksContainer);
            }
        }, 6000);
    }

    // 대형 폭죽 생성
    createMegaFirework(container) {
        const colors = ['#FF1744', '#FF6D00', '#FFD600', '#76FF03', '#00E676', '#00BCD4', '#2196F3', '#3F51B5', '#9C27B0', '#E91E63'];
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * (window.innerHeight * 0.5) + window.innerHeight * 0.1;

        // 더 많은 파티클로 대형 폭죽 효과
        for (let i = 0; i < 50; i++) {
            const particle = document.createElement('div');
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = (Math.PI * 2 * i) / 50;
            const velocity = Math.random() * 250 + 150;
            const size = Math.random() * 12 + 6;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, ${color}, ${color}88);
                border-radius: 50%;
                left: ${centerX}px;
                top: ${centerY}px;
                box-shadow: 0 0 20px ${color}, 0 0 40px ${color}66;
                animation: megaFirework-${Date.now()}-${i} 2.5s ease-out forwards;
            `;

            const keyframes = `
                @keyframes megaFirework-${Date.now()}-${i} {
                    0% {
                        transform: translate(0, 0) scale(1) rotate(0deg);
                        opacity: 1;
                    }
                    80% {
                        transform: translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity + 80}px) scale(0.8) rotate(360deg);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translate(${Math.cos(angle) * velocity * 1.2}px, ${Math.sin(angle) * velocity * 1.2 + 120}px) scale(0) rotate(720deg);
                        opacity: 0;
                    }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            container.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
                if (style.parentNode) style.parentNode.removeChild(style);
            }, 2500);
        }
    }

    // 별 모양 폭발 효과
    createStarBurst(container) {
        const starColors = ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#ADFF2F'];
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * (window.innerHeight * 0.6) + window.innerHeight * 0.2;

        for (let i = 0; i < 8; i++) {
            const star = document.createElement('div');
            const color = starColors[Math.floor(Math.random() * starColors.length)];
            const angle = (Math.PI * 2 * i) / 8;
            const distance = Math.random() * 200 + 100;

            star.innerHTML = '★';
            star.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 20 + 15}px;
                color: ${color};
                left: ${centerX}px;
                top: ${centerY}px;
                text-shadow: 0 0 10px ${color}, 0 0 20px ${color};
                animation: starBurst-${Date.now()}-${i} 2s ease-out forwards;
            `;

            const keyframes = `
                @keyframes starBurst-${Date.now()}-${i} {
                    0% {
                        transform: translate(0, 0) scale(0) rotate(0deg);
                        opacity: 1;
                    }
                    50% {
                        transform: translate(${Math.cos(angle) * distance * 0.7}px, ${Math.sin(angle) * distance * 0.7}px) scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 50}px) scale(0) rotate(360deg);
                        opacity: 0;
                    }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            container.appendChild(star);

            setTimeout(() => {
                if (star.parentNode) star.parentNode.removeChild(star);
                if (style.parentNode) style.parentNode.removeChild(style);
            }, 2000);
        }
    }

    // 하트 모양 폭죽
    createHeartFirework(container) {
        const heartColors = ['#FF1493', '#FF69B4', '#FFB6C1', '#DC143C', '#B22222'];
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * (window.innerHeight * 0.5) + window.innerHeight * 0.2;

        for (let i = 0; i < 12; i++) {
            const heart = document.createElement('div');
            const color = heartColors[Math.floor(Math.random() * heartColors.length)];
            const angle = (Math.PI * 2 * i) / 12;
            const distance = Math.random() * 180 + 80;

            heart.innerHTML = '💖';
            heart.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 25 + 20}px;
                left: ${centerX}px;
                top: ${centerY}px;
                filter: hue-rotate(${Math.random() * 360}deg) brightness(1.2);
                animation: heartBurst-${Date.now()}-${i} 3s ease-out forwards;
            `;

            const keyframes = `
                @keyframes heartBurst-${Date.now()}-${i} {
                    0% {
                        transform: translate(0, 0) scale(0);
                        opacity: 1;
                    }
                    30% {
                        transform: translate(${Math.cos(angle) * distance * 0.3}px, ${Math.sin(angle) * distance * 0.3}px) scale(1.2);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 100}px) scale(0);
                        opacity: 0;
                    }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            container.appendChild(heart);

            setTimeout(() => {
                if (heart.parentNode) heart.parentNode.removeChild(heart);
                if (style.parentNode) style.parentNode.removeChild(style);
            }, 3000);
        }
    }

    // 꽃잎 비 효과
    createPetalRain(container) {
        const petals = ['🌸', '🌺', '🌻', '🌼', '🌷', '🌹', '🏵️', '💐'];
        
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const petal = document.createElement('div');
                const petalType = petals[Math.floor(Math.random() * petals.length)];
                const startX = Math.random() * window.innerWidth;
                const drift = (Math.random() - 0.5) * 200;

                petal.innerHTML = petalType;
                petal.style.cssText = `
                    position: absolute;
                    font-size: ${Math.random() * 20 + 15}px;
                    left: ${startX}px;
                    top: -50px;
                    animation: petalFall-${Date.now()}-${i} ${Math.random() * 3 + 4}s linear forwards;
                `;

                const keyframes = `
                    @keyframes petalFall-${Date.now()}-${i} {
                        0% {
                            transform: translateY(0) rotate(0deg);
                            opacity: 1;
                        }
                        100% {
                            transform: translateY(${window.innerHeight + 100}px) translateX(${drift}px) rotate(${Math.random() * 720}deg);
                            opacity: 0;
                        }
                    }
                `;

                const style = document.createElement('style');
                style.textContent = keyframes;
                document.head.appendChild(style);

                container.appendChild(petal);

                setTimeout(() => {
                    if (petal.parentNode) petal.parentNode.removeChild(petal);
                    if (style.parentNode) style.parentNode.removeChild(style);
                }, 7000);
            }, i * 50);
        }
    }

    // 스파클 효과
    createSparkleEffect(container) {
        const centerX = Math.random() * window.innerWidth;
        const centerY = Math.random() * window.innerHeight;

        for (let i = 0; i < 15; i++) {
            const sparkle = document.createElement('div');
            const sparkleChar = ['✨', '⭐', '💫', '🌟'][Math.floor(Math.random() * 4)];
            
            sparkle.innerHTML = sparkleChar;
            sparkle.style.cssText = `
                position: absolute;
                font-size: ${Math.random() * 15 + 10}px;
                left: ${centerX + (Math.random() - 0.5) * 100}px;
                top: ${centerY + (Math.random() - 0.5) * 100}px;
                animation: sparkle-${Date.now()}-${i} 1.5s ease-in-out forwards;
            `;

            const keyframes = `
                @keyframes sparkle-${Date.now()}-${i} {
                    0%, 100% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.5) rotate(180deg);
                        opacity: 1;
                    }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            container.appendChild(sparkle);

            setTimeout(() => {
                if (sparkle.parentNode) sparkle.parentNode.removeChild(sparkle);
                if (style.parentNode) style.parentNode.removeChild(style);
            }, 1500);
        }
    }

    // 무지개 폭죽
    createRainbowFirework(container) {
        const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 3;

        for (let i = 0; i < 70; i++) {
            const particle = document.createElement('div');
            const color = rainbowColors[i % rainbowColors.length];
            const angle = (Math.PI * 2 * i) / 70;
            const velocity = Math.random() * 300 + 200;
            const size = Math.random() * 15 + 8;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                left: ${centerX}px;
                top: ${centerY}px;
                box-shadow: 0 0 30px ${color}, 0 0 60px ${color}88;
                animation: rainbow-${Date.now()}-${i} 3s ease-out forwards;
            `;

            const keyframes = `
                @keyframes rainbow-${Date.now()}-${i} {
                    0% {
                        transform: translate(0, 0) scale(1);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(${Math.cos(angle) * velocity}px, ${Math.sin(angle) * velocity + 100}px) scale(0);
                        opacity: 0;
                    }
                }
            `;

            const style = document.createElement('style');
            style.textContent = keyframes;
            document.head.appendChild(style);

            container.appendChild(particle);

            setTimeout(() => {
                if (particle.parentNode) particle.parentNode.removeChild(particle);
                if (style.parentNode) style.parentNode.removeChild(style);
            }, 3000);
        }
    }

    // 화려한 축하 배경 효과
    createMegaCelebrationEffect() {
        const overlay = document.createElement('div');
        overlay.className = 'mega-celebration-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: 
                radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 60% 60%, rgba(255, 215, 0, 0.3) 0%, transparent 50%);
            pointer-events: none;
            z-index: 9998;
            animation: megaCelebration 4s ease-in-out;
        `;

        if (!document.getElementById('mega-celebration-style')) {
            const style = document.createElement('style');
            style.id = 'mega-celebration-style';
            style.textContent = `
                @keyframes megaCelebration {
                    0%, 100% { 
                        opacity: 0; 
                        transform: scale(0.8); 
                        filter: hue-rotate(0deg);
                    }
                    50% { 
                        opacity: 1; 
                        transform: scale(1.2); 
                        filter: hue-rotate(180deg);
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(overlay);

        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 4000);
    }

    // 룰렛 회전 로직
    spin() {
        if (this.isSpinning) return; 
        this.isSpinning = true;
        this.spinButton.disabled = true;
        this.resultTextElement.textContent = '';
        this.resultTextElement.classList.remove('visible');

        // 완전히 동일한 확률 보장을 위한 랜덤 생성
        const randomFloat = Math.random(); // 0 이상 1 미만의 랜덤한 실수
        const totalRotation = (3 + Math.random() * 3) * 2 * Math.PI + randomFloat * 2 * Math.PI;

        // 캔버스 회전 적용
        this.canvas.style.transition = `transform ${this.spinDuration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
        this.canvas.style.transform = `rotate(${this.currentRotation + totalRotation}rad)`;
        
        // 최종 회전 각도 업데이트
        this.currentRotation += totalRotation;

        // 회전 완료 후 결과 처리
        setTimeout(() => {
            this.isSpinning = false;
            this.spinButton.disabled = false;
            
            // 현재 포인터가 실제로 가리키고 있는 세그먼트를 계산
            const pointedSegmentIndex = this.getPointerSegmentIndex();
            const winner = this.segments[pointedSegmentIndex];
            
            // 당첨 결과가 '꽝'이 아닌 경우에만 초강력 폭죽 효과 실행
            if (winner.text !== '꽝, 한번더!') {
                // 초강력 화려한 폭죽과 꽃놀이 효과 실행
                this.createSuperFireworks();
                this.createMegaCelebrationEffect();
            }
            
            // 결과 표시
            this.resultTextElement.textContent = `${winner.text} 당첨!`;
            this.resultTextElement.classList.add('visible');

            // 현재 회전 각도를 정규화 (0 ~ 2PI)
            this.currentRotation = (this.currentRotation % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
            
            // CSS transform도 정규화된 각도로 즉시 업데이트 (애니메이션 없이)
            this.canvas.style.transition = 'none'; 
            this.canvas.style.transform = `rotate(${this.currentRotation}rad)`;
            
            // 브라우저가 DOM 변경을 처리할 시간을 준 후 transition 복원
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    this.canvas.style.transition = `transform ${this.spinDuration / 1000}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
                });
            });

        }, this.spinDuration);
    }
}

// DOM 로드 완료 후 룰렛 게임 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    new SushiRoulette();
}); 