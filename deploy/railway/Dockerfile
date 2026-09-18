# ============================================================
# Backend Java (Spring Boot 3 / Java 21) — imagem para Railway
# Colocar este ficheiro na RAIZ do repositório do backend Java.
# ============================================================

# ---------- 1) Compilação ----------
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Cache das dependências
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Código-fonte
COPY src ./src
RUN mvn -B -DskipTests clean package

# ---------- 2) Execução ----------
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
