import {
  sendChatsRequestDto,
  listChatsRequestDto,
  leaveChatRequestDto,
} from "../dto/request/chats.request.dto.js";
import {
  sendChatsSvc,
  listChatsSvc,
  leaveChatSvc,
} from "../service/chats.service.js";
import {
  mapChatsResponseDto,
  mapChatsListResponseDto,
} from "../dto/response/chats.response.dto.js";


/**
 * **[Chats]**
 * **<🕹️ Controller>**
 * ***handleSendChats***
 * '채팅 전송' 기능 담당 API의 컨트롤러
 */
export const handleSendChats = async (req, res, next) => {
  /*
    #swagger.summary = '채팅 메시지 전송'
    #swagger.description = '특정 이벤트 채팅방에 새로운 메시지를 작성합니다.'
    #swagger.tags = ['Chats']
    #swagger.parameters['eventId'] = {
      in: 'path',
      required: true,
      schema: { type: 'integer', example: 10 },
      description: '메시지를 보낼 이벤트 ID'
    }
    #swagger.requestBody = {
      required : true,
      content:{
        "application/json":{
          schema:{
            type:"object",
            properties:{
              content:{ type:"string", example:"안녕하세요!" }
            },
            required:["content"]
          }
        }
      }
    }
    #swagger.responses[201] = {
      description: '채팅 메시지 작성 성공',
      content:{
        "application/json":{
          schema:{
            type:"object",
            properties:{
              id:{ type:"number", example:1 },
              eventId:{ type:"number", example:10 },
              userId:{ type:"number", example:5 },
              content:{ type:"string", example:"안녕하세요!" },
              createdAt:{ type:"string", example:"2025-09-12T04:12:34.000Z" }
            }
          }
        }
      }
    }
    #swagger.responses[400] = { description: '올바르지 않은 입력 값' }
    #swagger.responses[401] = { description: '로그인이 필요함' }
    #swagger.responses[403] = { description: '참여하지 않은 이벤트' }
    #swagger.responses[404] = { description: '이벤트를 찾을 수 없음' }
  */
  try {
    const dto = sendChatsRequestDto(req); // { eventId, userId, content }
    const created = await sendChatsSvc(dto);
    return res.status(201).json(mapChatsResponseDto(created));
  } catch (err) {
    return next(err);
  }
};


/**
 * **[Chats]**
 * **<🕹️ Controller>**
 * ***handleListChats***
 * '채팅 목록 조회' 기능 담당 API의 컨트롤러
 */
export const handleListChats = async (req, res, next) => {
  /*
    #swagger.summary = '채팅방 내용 불러오기'
    #swagger.description = '특정 이벤트(채팅방)의 메시지를 커서 기반으로 페이지네이션하여 조회합니다.'
    #swagger.tags = ['Chats']
    #swagger.parameters['eventId'] = {
      in: 'path', required: true,
      schema: { type: 'integer', minimum: 1 },
      description: '이벤트(채팅방) ID'
    }
    #swagger.parameters['cursor'] = {
      in: 'query', required: false,
      schema: { type: 'integer', minimum: 1 },
      description: '이전 페이지의 마지막 메시지 id (다음 페이지 조회용)'
    }
    #swagger.parameters['size'] = {
      in: 'query', required: false,
      schema: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
      description: '가져올 메시지 개수'
    }
    #swagger.responses[200] = {
      description: '메시지 목록 조회 성공',
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 101 },
                    eventId: { type: "number", example: 10 },
                    userId: { type: "number", example: 5 },
                    content: { type: "string", example: "안녕하세요!" },
                    createdAt: { type: "string", example: "2025-09-12T04:12:34.000Z" }
                  }
                }
              },
              nextCursor: { type: "number", nullable: true, example: 77 }
            }
          }
        }
      }
    }
    #swagger.responses[401] = { description: '로그인이 필요함' }
    #swagger.responses[403] = { description: '참여하지 않은 이벤트' }
    #swagger.responses[404] = { description: '이벤트를 찾을 수 없음' }
  */
  try {
    const dto = listChatsRequestDto(req); // { eventId, cursor, size }
    const { items, nextCursor } = await listChatsSvc(dto);
    return res.status(200).json(mapChatsListResponseDto(items, nextCursor));
  } catch (err) {
    return next(err);
  }
};


/**
 * **[Chats]**
 * **<🕹️ Controller>**
 * ***handleLeaveChat***
 * '채팅방 나가기' 기능 담당 API의 컨트롤러
 */
export const handleLeaveChat = async (req, res, next) => {
  /*
    #swagger.summary = '채팅방 나가기'
    #swagger.description = '특정 이벤트(채팅방)에서 사용자 세션을 종료합니다. (DB 변경 없음)'
    #swagger.tags = ['Chats']
    #swagger.parameters['eventId'] = {
      in: 'path', required: true,
      schema: { type: 'integer', minimum: 1 },
      description: '이벤트(채팅방) ID'
    }
    #swagger.responses[204] = { description: '나가기 처리 완료 (본문 없음)' }
    #swagger.responses[401] = { description: '로그인이 필요함' }
    #swagger.responses[403] = { description: '참여하지 않은 이벤트' }
    #swagger.responses[404] = { description: '이벤트를 찾을 수 없음' }
  */
  try {
    const dto = leaveChatRequestDto(req); // { eventId, userId }
    await leaveChatSvc(dto);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
};
