FROM openresty/openresty:alpine

# Install envsubst, curl, CA certs, perl (for opm); ensure log dir exists; install lua-resty-http
RUN apk add --no-cache gettext curl ca-certificates perl && \
    update-ca-certificates && \
    mkdir -p /var/log/nginx && \
    /usr/local/openresty/bin/opm get ledgetech/lua-resty-http

# Copy nginx configuration to OpenResty's conf path
COPY nginx.conf /usr/local/openresty/nginx/conf/nginx.conf

# Create a startup script that substitutes environment variables used in the config
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Check required environment variables' >> /docker-entrypoint.sh && \
    echo 'if [ -z "$PROMPTQL_API_KEY" ]; then' >> /docker-entrypoint.sh && \
    echo '  echo "Error: PROMPTQL_API_KEY environment variable is required"' >> /docker-entrypoint.sh && \
    echo '  exit 1' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Set default values for optional variables' >> /docker-entrypoint.sh && \
    echo 'export PROMPTQL_API_ENDPOINT=${PROMPTQL_API_ENDPOINT:-promptql.ddn.pro.hasura.io:443}' >> /docker-entrypoint.sh && \
    echo 'export PROMPTQL_API_HOST=${PROMPTQL_API_HOST:-promptql.ddn.pro.hasura.io}' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Substitute environment variables in nginx config' >> /docker-entrypoint.sh && \
    echo 'envsubst '"'"'$PROMPTQL_API_KEY $PROMPTQL_API_ENDPOINT $PROMPTQL_API_HOST'"'"' < /usr/local/openresty/nginx/conf/nginx.conf > /usr/local/openresty/nginx/conf/nginx.conf.tmp' >> /docker-entrypoint.sh && \
    echo 'mv /usr/local/openresty/nginx/conf/nginx.conf.tmp /usr/local/openresty/nginx/conf/nginx.conf' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Start OpenResty (nginx with lua)' >> /docker-entrypoint.sh && \
    echo 'exec openresty -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Use our custom entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
