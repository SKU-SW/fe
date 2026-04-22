import { Send } from "lucide-react";

export function SimpleDashboard() {
  const qaItems = [
    {
      question: "Q1. 오늘 뭐 먹을까?",
      answers: [
        "A. 오늘 출시예정인 음성 마이크를 장바구니 담아봐 걱정",
        "B. 오늘 서쪽 목욕탕 그곳은 새로운 것에서 새로운 경험을 하고 있어"
      ]
    },
    {
      question: "Q2. AI는 어떻게 작동하나요?",
      answers: [
        "A. 스트리머의 음성을 실시간으로 인식하여 자연스러운 대화를 생성합니다",
        "B. 채팅창을 분석하여 시청자의 감정과 반응을 파악합니다"
      ]
    },
    {
      question: "Q3. 주요 기능은?",
      answers: [
        "A. 음성 인식 및 TTS 출력 시스템",
        "B. 실시간 채팅 분석 및 자동 반응",
        "C. 게임 이벤트 연동 및 도네이션 시스템"
      ]
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">메인</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              추천 받기
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              테마 여행
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              내 여행
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              my travel map 🗺️
            </button>
            <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-full hover:bg-gray-800">
              AI 맞춤 여행지 추천
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-8 px-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">AI 맞춤 여행지 추천</h3>
          
          <div className="space-y-6">
            {qaItems.map((item, index) => (
              <div key={index} className="bg-blue-50 rounded-2xl p-6">
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900">{item.question}</p>
                </div>
                <div className="space-y-2">
                  {item.answers.map((answer, answerIndex) => (
                    <p key={answerIndex} className="text-sm text-gray-700">
                      {answer}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 bg-gray-100 rounded-full px-5 py-3">
            <input
              type="text"
              placeholder="Type your message..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
            />
            <button className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center hover:bg-gray-800">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="bg-white px-8 py-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center max-w-4xl mx-auto">
          - 간단한 5~6개의 질문 후 사용자의 현재 상태에 가장 알맞은 여행지 추천
        </p>
      </div>
    </div>
  );
}
