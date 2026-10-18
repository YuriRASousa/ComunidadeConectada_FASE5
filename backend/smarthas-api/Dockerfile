# Smart HAS API - imagem de execucao
#
# Build em duas etapas: a primeira compila com o Maven Wrapper do projeto,
# a segunda leva so o jar para uma imagem enxuta, rodando sem root.
#
#   docker build -t smarthas-api backend/smarthas-api
#   docker run -p 8080:8080 -e ORACLE_URL=... -e ORACLE_USER=... -e ORACLE_PASSWORD=... smarthas-api
FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline
COPY src src
RUN ./mvnw -B -q -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system --uid 10001 smarthas
COPY --from=build /src/target/smarthas-api-0.0.1-SNAPSHOT.jar app.jar
USER smarthas
EXPOSE 8080
# Credenciais e segredos entram por variavel de ambiente, nunca na imagem:
# ORACLE_URL, ORACLE_USER, ORACLE_PASSWORD, JWT_SECRET, CORS_ORIGINS
ENTRYPOINT ["java", "-jar", "app.jar"]
