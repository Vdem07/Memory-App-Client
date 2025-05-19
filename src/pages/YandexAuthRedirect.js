import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const YandexAuthRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Дожидаемся загрузки страницы, затем вызываем YaSendSuggestToken
    const script = document.createElement("script");
    script.src = "https://yastatic.net/s3/passport-sdk/autofill/v1/sdk-suggest-token-with-polyfills-latest.js";
    script.onload = () => {
      if (window.YaSendSuggestToken) {
        window.YaSendSuggestToken(window.location.origin, { flag: true });
      }
    };
    document.body.appendChild(script);

    // Через небольшую задержку перенаправляем пользователя
    setTimeout(() => {
      window.close()
      navigate("/");
    }, 1000);

    return () => {
      document.body.removeChild(script);
    };
  }, [navigate]);

  return <div style={{ background: "#eee", height: "100vh" }} />;
};

export default YandexAuthRedirect;
