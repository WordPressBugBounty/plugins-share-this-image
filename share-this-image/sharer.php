<!DOCTYPE html>

<html itemscope itemtype="http://schema.org/Blog">

    <head>

        <meta charset="UTF-8">
        <meta property="og:type" content="article" />
        <meta name="twitter:card" content="summary_large_image">

        <?php

        function sti_validate_image_url($image_url) {
            if (!is_string($image_url)) {
                return false;
            }

            $image_url = trim($image_url);
            if ($image_url === '') {
                return false;
            }

            $parts = parse_url($image_url);
            if ($parts === false || empty($parts['host'])) {
                return false;
            }

            $scheme = isset($parts['scheme']) ? strtolower($parts['scheme']) : 'http';
            if ($scheme !== 'http' && $scheme !== 'https') {
                return false;
            }

            $host = $parts['host'];
            $host_lc = strtolower($host);

            $blocked_hosts = array('127.0.0.1', 'localhost', '::1');
            if (in_array($host_lc, $blocked_hosts, true)) {
                return false;
            }

            if (filter_var($host, FILTER_VALIDATE_IP)) {
                $ip = $host;
            } else {
                $ip = gethostbyname($host);
                // gethostbyname returns the input host if it cannot resolve
                if ($ip === $host) {
                    return false;
                }
                if (!filter_var($ip, FILTER_VALIDATE_IP)) {
                    return false;
                }
            }

            $is_public = (bool) filter_var(
                $ip,
                FILTER_VALIDATE_IP,
                FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
            );

            if (!$is_public) {
                return false;
            }

            // Build a "safe" normalized URL.
            $safe = $scheme . '://' . $host;

            if (!empty($parts['port'])) {
                $port = (int) $parts['port'];
                if ($port < 1 || $port > 65535) {
                    return false;
                }
                $safe .= ':' . $port;
            }

            $path = $parts['path'] ?? '';
            if ($path !== '') {
                // Ensure it starts with "/" if present
                if ($path[0] !== '/') {
                    $path = '/' . $path;
                }
                // Encode path safely but keep "/" separators.
                $safe .= implode('/', array_map('rawurlencode', explode('/', $path)));
            }

            if (!empty($parts['query'])) {
                // Query can be left as-is; strip control chars for safety.
                $query = preg_replace('/[\x00-\x1F\x7F]/u', '', $parts['query']);
                $safe .= '?' . $query;
            }

            return $safe;
        }

        $http_ext = isset( $_GET['ssl'] ) ? 'https://' : 'http://';
        
        $url = isset( $_GET['url'] ) ? htmlspecialchars( $_GET['url'] ) : '';

        if ( $url ) {
            $url_params = parse_url( $url );
            if ( ! $url_params || ( isset( $url_params['host'] ) && $url_params['host'] !== $_SERVER['HTTP_HOST'] ) ) {
                $url = $http_ext . $_SERVER["SERVER_NAME"];
            }
        }

        if ( isset( $_GET['img'] ) ) {

            $image_url = sti_validate_image_url( $http_ext . htmlspecialchars( $_GET['img'] ) );

            if ( $image_url ) {

                $page_link = $http_ext . $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
                $title = isset( $_GET['title'] ) ? htmlspecialchars( urldecode( $_GET['title'] ) ) : '';
                $desc = isset( $_GET['desc'] ) ? htmlspecialchars( urldecode( $_GET['desc'] ) ) : '';
                $network = isset( $_GET['network'] ) ? htmlspecialchars( $_GET['network'] ) : '';

                // check $image befor calling
                $image_sizes = @getimagesize( $image_url );

                //if ( $network !== 'facebook' ) {
                echo '<link rel="canonical" href="' . $page_link . '" />';
                echo '<meta property="og:url" content="' . $page_link . '" />';
                echo '<meta property="twitter:url" content="' . $page_link . '" />';
                //}

                echo '<meta property="og:image" content="' . $image_url . '" />';
                echo '<meta property="twitter:image" content="' . $image_url . '" />';
                echo '<meta property="twitter:image:src" content="' . $image_url . '" />';

                if ( $image_sizes ) {
                    list( $width, $height ) = $image_sizes;
                    echo '<meta property="og:image:width" content="' . intval( $width ) . '" />';
                    echo '<meta property="og:image:height" content="' . intval( $height ) . '" />';
                    echo '<meta property="twitter:image:width" content="' . intval( $width ) . '" />';
                    echo '<meta property="twitter:image:height" content="' . intval( $height ) . '" />';
                }

                if ( $title ) {
                    echo '<title>'.$title.'</title>';
                    echo '<meta property="og:title" content="'.$title.'" />';
                    echo '<meta property="twitter:title" content="'.$title.'" />';
                    echo '<meta property="og:site_name" content="'.$title.'" />';
                }

                if ( $desc ) {
                    echo '<meta name="description" content="'.$desc.'">';
                    echo '<meta property="og:description" content="'.$desc.'" />';
                    echo '<meta property="twitter:description" content="'.$desc.'" />';
                }

            }

        }

        if (
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'linkedin' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'search.google.com' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'developers.google.com' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'Google-AMPHTML' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], '.facebook.com' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'Twitterbot' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'LinkedInBot' ) ) &&
            ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'WhatsApp' ) ) &&
            $_SERVER['REMOTE_ADDR'] !== '108.174.2.200' &&
            $_SERVER['REMOTE_ADDR'] !== '66.249.81.90' &&
            $_SERVER['REMOTE_ADDR'] !== '31.13.97.116' &&
            ( ! isset( $_GET['debug'] ) )
        ) {
            echo '<meta http-equiv="refresh" content="0;url='.$url.'">';
        }

        ?>

        <style type="text/css">     
                body {background:#fff;font-family: arial,helvetica,lucida,verdana,sans-serif;margin:0;padding:0;}h1 {background:#f5f5f5;border-top:1px solid #eee;border-bottom:1px solid #eee;margin-top:10%;padding:50px;font-size:1.4em;font-weight:normal;text-align:center;color:#000;}
        </style>

    </head>

    <body>	
            <h1>contacting ...</h1>
    </body>

</html>																			