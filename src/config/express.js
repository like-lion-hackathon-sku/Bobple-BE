import express from "express";
import cors from "cors";
import { commonResponse } from "../utils/response.js";
import cookieParser from "cookie-parser";
export const setupExpress = () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors()); // cors 방식 허용
  app.use(express.static("public")); // 정적 파일 접근
  app.use(express.json()); // request의 본문을 json으로 해석할 수 있도록 함 (JSON 형태의 요청 body를 파싱하기 위함)
  app.use(express.urlencoded({ extended: false })); // 단순 객체 문자열 형태로 본문 데이터 해석
  app.use(cookieParser());
  app.use(commonResponse); // 공통 응답을 사용할 수 있는 헬퍼 함수 등록

  return app;
};
export const setupCommonError = (app) => {
  app.use((err, req, res, next) => {
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.statusCode || 500).error({
      errorCode: err.errorCode || "unknown",
      reason: err.reason || err.message || null,
      data: err.data || null,
    });
  });
};
