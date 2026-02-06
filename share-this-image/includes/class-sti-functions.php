<?php
/**
 * STI functions
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit; // Exit if accessed directly.
}

if ( ! class_exists( 'STI_Functions' ) ) :

    /**
     * Class for main plugin functions
     */
    class STI_Functions {

        /**
         * @var STI_Functions The single instance of the class
         */
        protected static $_instance = null;

        /**
         * Main STI_Functions Instance
         * @static
         * @return STI_Functions - Main instance
         */
        public static function instance() {
            if ( is_null( self::$_instance ) ) {
                self::$_instance = new self();
            }
            return self::$_instance;
        }

        /**
         * Setup actions and filters for all things settings
         */
        public function __construct() {

            add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_scripts' ), 999999 );
            add_action( 'wp_head', array( $this, 'metatags' ), 1 );

            if ( $this->is_sharing() ) {

                add_filter( 'wp_title', array( $this, 'generate_title' ), 999999 );

                add_filter( 'wpseo_opengraph_image', array( $this, 'disable_yoast' ), 999999 );
                add_filter( 'wpseo_twitter_image', array( $this, 'disable_yoast' ), 999999 );

                add_filter( 'wpseo_og_og_image_width', array( $this, 'disable_yoast' ), 999999 );
                add_filter( 'wpseo_og_og_image_height', array( $this, 'disable_yoast' ), 999999 );

                add_filter( 'wpseo_opengraph_title', array( $this, 'disable_yoast' ), 999999 );
                add_filter( 'wpseo_twitter_title', array( $this, 'disable_yoast' ), 999999 );
                add_filter( 'wpseo_title', array( $this, 'disable_yoast' ), 999999 );

                add_filter( 'wpseo_opengraph_desc', array( $this, 'disable_yoast' ), 999999 );
                add_filter( 'wpseo_twitter_description', array( $this, 'disable_yoast' ), 999999 );
                add_filter( 'wpseo_metadesc', array( $this, 'disable_yoast' ), 999999 );

                add_action( 'wpseo_head', array( $this, 'disable_yoast' ), 999999 );

                add_filter( 'wpseo_canonical', array( $this, 'disable_yoast' ), 999999 );

                add_filter( 'wpseo_opengraph_type', array( $this, 'disable_yoast' ), 999999 );

                add_filter( 'wpseo_output_twitter_card', array( $this, 'disable_yoast' ), 999999 );

            }

        }

        /*
         * Register plugin settings
         */
        public function get_settings( $id = false ) {
            $sti_options = get_option( 'sti_settings' );
            if ( $id && $sti_options ) {
                $val = isset( $sti_options[ $id ] ) ? $sti_options[ $id ] : '';
                return $val;
            } else {
                return $sti_options;
            }
        }

        /*
         * Return list of active share buttons
         */
        private function get_buttons() {

            $all_buttons_array = $this->get_settings('buttons');
            $buttons_array = array();

            if ( $all_buttons_array && is_array( $all_buttons_array ) ) {
                foreach ( $all_buttons_array as $button_name => $button_opts ) {
                    foreach ( $button_opts as $button_device => $button_device_param ) {
                        if ( $button_device_param === 'true' ) {
                            $buttons_array[$button_device][] = $button_name;
                            $buttons_array['icons'][$button_name] = STI_Helpers::get_svg($button_name);
                        }
                    }
                }
                $buttons_array['icons']['mobile'] = STI_Helpers::get_svg('mobile');
            }

            /**
             * Array of sharing buttons
             * @since 1.22
             * @param $buttons_array array
             */
            $buttons_array = apply_filters( 'sti_buttons_array', $buttons_array );

            return $buttons_array;

        }

        /**
         * Enqueue frontend scripts and styles
         *
         * @return void
         */
        public function enqueue_scripts() {

            $settings = $this->get_settings();

            $display_conditions = isset( $settings['display_rules'] ) ? $settings['display_rules'] : array();


            /**
             * Exclude or not current page from sharing
             * @since 1.33
             * @param bool false
             */
            $exclude_this_page = apply_filters( 'sti_exclude_current_page', false );

            if ( ( wp_is_mobile() && $settings['on_mobile'] === 'false' ) || $exclude_this_page ) {
                return;
            }

            $condition = new STI_Conditions_Check( $display_conditions );
            $match_condition = $condition->match();

            if ( ! $match_condition ) {
                $selector = 'hide-images';
            } else {
                $matched_conditions = $condition->get_matched_conditions();
                $selector = STI_Helpers::generate_css_selector( $matched_conditions );
            }

            /**
             * Filter the array of custom parameters
             * @since 1.31
             * @param array $custom_data Array custom parameters
             */
            $custom_data = apply_filters( 'sti_js_custom_data', array() );

            $sti_vars = array(
                'ajaxurl'      => admin_url( 'admin-ajax.php' ),
                'nonce'        => wp_create_nonce('sti_shortlinks'),
                'homeurl'      => home_url( '/' ),
                'selector'     => $selector,
                'title'        => stripslashes( $settings['title'] ),
                'summary'      => stripslashes( $settings['summary'] ),
                'short_url'    => $settings['short_url'],
                'url_structure' => get_option( 'permalink_structure' ),
                'minWidth'     => $settings['minWidth'],
                'minHeight'    => $settings['minHeight'],
                'sharer'       => ( $settings['sharer'] == 'true' ) ? STI_URL . '/sharer.php' : '',
                'position'     => $settings['position'],
                'analytics'    => ( $settings['use_analytics'] == 'true' ) ? true : false,
                'buttons'      => $this->get_buttons(),
                'twitterVia'   => $settings['twitter_via'],
                'appId'        => $settings['fb_app'],
                'zIndex'       => $settings['zIndex'],
                'custom_data'  => $custom_data,
            );

            /**
             * Filter the array of plugin parameters
             * @since 1.35
             * @param array $custom_data Plugin parameters
             */
            $sti_vars = apply_filters( 'sti_js_plugin_data', $sti_vars );

            $suffix = defined('SCRIPT_DEBUG') && SCRIPT_DEBUG ? '' : '.min';

            wp_enqueue_style( 'sti-style', STI_URL . '/assets/css/sti' . $suffix . '.css', array(), STI_VER );
            wp_enqueue_script( 'sti-script', STI_URL . '/assets/js/sti' . $suffix . '.js', array('jquery'), STI_VER, true );
            wp_localize_script( 'sti-script', 'sti_vars', $sti_vars );

        }

        /*
         * Validate and sanitize image URL to prevent SSRF attacks
         */
        private function validate_image_url( $image_url ) {
            if ( empty( $image_url ) ) {
                return false;
            }

            $image_url = wp_unslash( $image_url );
            $image_url = trim( $image_url );

            $image_url = esc_url_raw( $image_url );
            if ( empty( $image_url ) ) {
                return false;
            }

            $parsed = wp_parse_url( $image_url );
            if ( ! $parsed || empty( $parsed['host'] ) ) {
                return false;
            }

            if ( ! empty( $parsed['user'] ) || ! empty( $parsed['pass'] ) ) {
                return false;
            }

            $scheme = isset( $parsed['scheme'] ) ? strtolower( $parsed['scheme'] ) : '';
            if ( ! in_array( $scheme, array( 'http', 'https' ), true ) ) {
                return false;
            }

            $host = strtolower( $parsed['host'] );

            $blocked_hosts = array( 'localhost' );
            if ( in_array( $host, $blocked_hosts, true ) ) {
                return false;
            }

            if ( ! empty( $parsed['port'] ) ) {
                $port = (int) $parsed['port'];
                if ( ! in_array( $port, array( 80, 443 ), true ) ) {
                    return false;
                }
            }

            if ( filter_var( $host, FILTER_VALIDATE_IP ) ) {
                if ( ! filter_var( $host, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
                    return false;
                }
            } else {

                $ips = array();

                if ( function_exists( 'dns_get_record' ) ) {
                    $a = @dns_get_record( $host, DNS_A );
                    if ( is_array( $a ) ) {
                        foreach ( $a as $r ) {
                            if ( ! empty( $r['ip'] ) ) {
                                $ips[] = $r['ip'];
                            }
                        }
                    }

                    $aaaa = @dns_get_record( $host, DNS_AAAA );
                    if ( is_array( $aaaa ) ) {
                        foreach ( $aaaa as $r ) {
                            if ( ! empty( $r['ipv6'] ) ) {
                                $ips[] = $r['ipv6'];
                            }
                        }
                    }
                }

                // If DNS lookup failed, reject
                $ips = array_values( array_unique( array_filter( $ips ) ) );
                if ( empty( $ips ) ) {
                    return false;
                }

                foreach ( $ips as $ip ) {
                    if ( ! filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE ) ) {
                        return false;
                    }
                }
            }

            // Rebuild without user/pass/fragments
            $safe_url = $scheme . '://' . $host;
            if ( ! empty( $parsed['port'] ) ) {
                $safe_url .= ':' . (int) $parsed['port'];
            }
            if ( ! empty( $parsed['path'] ) ) {
                $safe_url .= $parsed['path'];
            }
            if ( ! empty( $parsed['query'] ) ) {
                $safe_url .= '?' . $parsed['query'];
            }

            $safe_url = esc_url_raw( $safe_url );
            if ( empty( $safe_url ) ) {
                return false;
            }

            $args = array(
                'timeout'     => 10,
                'redirection' => 5,
                'sslverify'   => true,
                'headers'     => array(
                    'Accept' => 'image/*',
                ),
            );

            $response = wp_safe_remote_head( $safe_url, $args );

            $code         = is_wp_error( $response ) ? 0 : wp_remote_retrieve_response_code( $response );
            $content_type = is_wp_error( $response ) ? '' : (string) wp_remote_retrieve_header( $response, 'content-type' );

            if ( is_wp_error( $response ) || ( $code !== 200 && $code !== 206 ) || empty( $content_type ) ) {
                // Fallback: small-range GET (some servers break HEAD)
                $args['headers']['Range'] = 'bytes=0-2047';
                $response = wp_safe_remote_get( $safe_url, $args );

                if ( is_wp_error( $response ) ) {
                    return false;
                }

                $code         = wp_remote_retrieve_response_code( $response );
                $content_type = (string) wp_remote_retrieve_header( $response, 'content-type' );

                if ( $code !== 200 && $code !== 206 ) {
                    return false;
                }

                // Optional stronger check: sniff bytes as image
                $body = wp_remote_retrieve_body( $response );
                if ( empty( $body ) ) {
                    return false;
                }

                $sniffed = function_exists( 'wp_get_image_mime' ) ? wp_get_image_mime( $body ) : false;
                if ( empty( $sniffed ) ) {
                    return false;
                }
                $content_type = $sniffed; // normalize to actual
            }

            if ( stripos( $content_type, 'image/' ) !== 0 ) {
                return false;
            }
            if ( strtolower( $content_type ) === 'image/svg+xml' ) {
                return false;
            }

            return $safe_url;
        }

        /**
         * Add special metatags to the head of the site
         */
        public function metatags() {

            if ( $this->is_sharing() ) {

                // Validate image URL to prevent SSRF
                if ( ! isset( $_GET['img'] ) || empty( $_GET['img'] ) ) {
                    return;
                }

                $http_ext = isset( $_GET['ssl'] ) ? 'https://' : 'http://';

                $image_url = $this->validate_image_url( $http_ext . sanitize_text_field( wp_unslash( $_GET['img'] ) ) );
                if ( ! $image_url ) {
                    return; // Invalid or blocked image URL
                }

                $page_link = esc_url( $http_ext . $_SERVER["SERVER_NAME"] . $_SERVER["REQUEST_URI"] );

                $title = isset( $_GET['title'] ) ? htmlspecialchars( urldecode( $_GET['title'] ) ) : '';
                $desc = isset( $_GET['desc'] ) ? htmlspecialchars( urldecode( $_GET['desc'] ) ) : '';
                $network = isset( $_GET['network'] ) ? htmlspecialchars( $_GET['network'] ) : '';
                $url = isset( $_GET['url'] ) ? htmlspecialchars( $_GET['url'] ) : '';
                if ( $url && strpos( $url, $_SERVER['HTTP_HOST'] ) === false ) {
                    $url = '';
                }

                $image_sizes = @getimagesize( $image_url );

                echo '<!-- Share This Image plugin meta tags -->';

                echo '<meta property="og:type" content="article" />';
                echo '<meta name="twitter:card" content="summary_large_image">';

                //if ( $network !== 'facebook' ) {
                    echo '<link rel="canonical" href="' . $page_link . '" />';
                    echo '<meta property="og:url" content="' . $page_link . '" />';
                    echo '<meta property="twitter:url" content="' . $page_link . '" />';
                //}

                echo '<meta property="og:image" content="' . esc_attr( $image_url ) . '" />';

                if ( $network == 'twitter' ) {
                    echo '<meta property="twitter:image" content="' . esc_attr( $image_url ) . '" />';
                    echo '<meta property="twitter:image:src" content="' . esc_attr( $image_url ) . '" />';
                }

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
                    echo '<meta property="og:description" content="'.$desc.'"/>';
                    echo '<meta property="twitter:description" content="'.$desc.'"/>';
                }

                if ( $url &&
                    ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'linkedin' ) ) &&
                    ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'search.google.com' ) ) &&
                    ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'developers.google.com' ) ) &&
                    ( ! strpos( $_SERVER['HTTP_USER_AGENT'], 'Google-AMPHTML' ) ) &&
                    ( ! strpos( $_SERVER['HTTP_USER_AGENT'], '.facebook.com' ) ) &&
                    $_SERVER['REMOTE_ADDR'] !== '108.174.2.200' &&
                    $_SERVER['REMOTE_ADDR'] !== '66.249.81.90' &&
                    $_SERVER['REMOTE_ADDR'] !== '31.13.97.116' &&
                    ( ! isset( $_GET['debug'] ) )
                ) {
                    echo '<style>body, body * { opacity: 0; overflow: hidden;}</style>';
                    echo '<meta http-equiv="refresh" content="0;url='.$url.'">';
                }

                echo '<!-- END Share This Image plugin meta tags -->';

            }

            if ( isset( $_GET['close'] ) ) { ?>
                <script type="text/javascript">
                    window.close();
                </script>
            <?php }

        }

        /*
         * Disable yoast metatags
         */
        public function disable_yoast( $content ) {
            return false;
        }

        /*
         * Add shared title in don't use
         */
        public function generate_title( $title ) {
            $title = isset( $_GET['title'] ) ? sanitize_text_field( urldecode( $_GET['title'] ) ) : '';
            return $title;
        }

        /*
         * Check if need to add meta tags on page for shared content
         */
        private function is_sharing() {
            return isset( $_GET['img'] );
        }

    }


endif;

STI_Functions::instance();