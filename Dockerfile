# ============================================================
# Backend Java (Spring Boot 3 / Java 21) — imagem para Railway
#
# O código-fonte Java NÃO está neste repositório (aqui está o
# portal em React). Por isso a imagem obtém o backend diretamente
# do repositório público no GitHub antes de compilar.
# ============================================================

# ---------- 1) Obter o código-fonte Java ----------
FROM alpine:3.20 AS source
RUN apk add --no-cache git
ARG JAVA_REPO=https://github.com/lauroclaudia-pt/appJavaRAilway.git
ARG JAVA_BRANCH=main
RUN git clone --depth 1 --branch "$JAVA_BRANCH" "$JAVA_REPO" /source

# ---------- 2) Compilação ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build
COPY --from=source /source ./
RUN mvn -B -DskipTests clean package

# ---------- 3) Execução ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
COPY --from=build /build/target/*.jar /app/app.jar
USER app

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
ENV PORT=8080
EXPOSE 8080

# O Railway injeta a variável PORT
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT} -jar /app/app.jar"]
