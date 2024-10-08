// StiHooks

var StiHooks = StiHooks || {};
StiHooks.filters = StiHooks.filters || {};

(function($){
    "use strict";

    var selector = sti_vars.selector;
	var currentImage = false;
	var currentImageElements = {};

	StiHooks.add_filter = function( tag, callback, priority ) {

		if( typeof priority === "undefined" ) {
			priority = 10;
		}

		StiHooks.filters[ tag ] = StiHooks.filters[ tag ] || [];
		StiHooks.filters[ tag ].push( { priority: priority, callback: callback } );

	};

	StiHooks.apply_filters = function( tag, value, options ) {

		var filters = [];

		if( typeof StiHooks.filters[ tag ] !== "undefined" && StiHooks.filters[ tag ].length > 0 ) {

			StiHooks.filters[ tag ].forEach( function( hook ) {

				filters[ hook.priority ] = filters[ hook.priority ] || [];
				filters[ hook.priority ].push( hook.callback );
			} );

			filters.forEach( function( StiHooks ) {

				StiHooks.forEach( function( callback ) {
					value = callback( value, options );
				} );

			} );
		}

		return value;
	};

	$.fn.sti = function( options ) {
	
		var opts = $.extend({
			ajaxurl: sti_vars.ajaxurl,
			homeurl: sti_vars.homeurl,
			selector: sti_vars.selector,
			title: sti_vars.title,
			summary: sti_vars.summary,
			short_url: sti_vars.short_url,
			url_structure: sti_vars.url_structure,
			minWidth: sti_vars.minWidth,
			minHeight: sti_vars.minHeight,
			sharer: sti_vars.sharer,
			position: sti_vars.position,
			analytics: sti_vars.analytics,
			buttons: sti_vars.buttons,
			twitterVia: sti_vars.twitterVia,
			appId: sti_vars.appId,
			zIndex: sti_vars.zIndex,
            align: {x:"left", y:"top"},
            offset: {x:0, y:0},
			custom_data: sti_vars.custom_data
        }, options );

		var stiBoxSingleSelector = '';

		var appendButtonsTo = StiHooks.apply_filters( 'sti_append_buttons_to', 'body' );

		var methods = {

			createHash: function( str, chars ) {
				var character,
					hash,
					i;
							
				if( !str ) { return ""; }
						
				hash = 0;
						
				if ( str.length === 0 ) { return hash; }
						
				for( i=0;i<str.length;i++ ) {
					character = str[i];
					hash = methods.hashChar( str,character,hash );
				}

                hash = Math.abs( hash ) * 1.1 + "";
						
				return hash.substring( 0, chars );
						
			},

			scrollToImage: function(el) {

				var urlParam = methods.getUrlParams();
				var hash = ( typeof urlParam['scroll'] !== 'undefined' ) ? urlParam['scroll'] : '';

				if ( ! hash ) {
					return;
				}

				$('img, [data-media]').each(function() {
					var media = $(this).data('media') ? $(this).data('media') : $(this)[0].src;

					if ( media ) {
						media = methods.fillFullPath( media );
						media = methods.checkForImgFullSize( media );
					}

					if ( hash === methods.createHash( media, 5 ) ) {
						// Divi gallery support
						if ( $(this).closest('.et_pb_gallery_item').length ) {
							$(this).trigger('click');
							return false;
						}
					}

				});

			},
			
			hashChar: function( str,character,hash ) {				
				hash = ( hash<<5 ) - hash + str.charCodeAt( character );					
				return hash&hash;					
			},

			stringToId: function( input ) {
				var hash = 0, len = input.length;
				for (var i = 0; i < len; i++) {
					hash  = ((hash << 5) - hash) + input.charCodeAt(i);
					hash |= 0;
				}
				return hash;
			},
			
			shareButtons: function() {
			
				var buttonsList = '';

				var buttons = methods.isMobile() ? opts.buttons.mobile : opts.buttons.desktop;

				if ( buttons ) {
					for ( var i=0;i<buttons.length;i++ ) {
						var network = buttons[i];
						buttonsList += '<div class="sti-btn sti-' + network +'-btn" data-network="' + network + '" rel="nofollow">';
						buttonsList += methods.getSvgIcon( network );
						buttonsList += '</div>';
					}
				}
				
				return buttonsList;
				
			},

            getSvgIcon: function( network ) {

                var icon = '';

				if ( opts.custom_data && opts.custom_data.buttons && opts.custom_data.buttons[network] ) {
					icon += opts.custom_data.buttons[network]['icon'];
					return icon;
				}

				if ( opts.buttons && opts.buttons.icons && opts.buttons.icons[network] ) {
					icon = opts.buttons.icons[network];
				}

                return icon;

            },
			
			showShare: function(e, box, relative) {

				e = StiHooks.apply_filters( 'sti_share_container', e, { box: box, opts: opts, relative: relative } );

				if ( ! e ) {
					return false;
				}

				methods.setBoxLayout.call(e, box, relative);

				$(box).show();

			},

			detectRightContainer: function(el) {

				var e = $(el);

				if ( e.closest('.sti').length > 0 ) return false;
				if ( methods.isMobile() && el.nodeName === 'IMG' ) {
					if ( e[0].naturalWidth < opts.minWidth || e[0].naturalHeight < opts.minHeight ) return false;
				} else {
					if ( e.width() < opts.minWidth || e.height() < opts.minHeight ) return false;
				}

				if ( e.closest('.nivoSlider').length ) {
					e = e.closest('.nivoSlider');
				}
				else if ( e.closest('.coin-slider').length ) {
					e = e.closest('.coin-slider');
				}
				else if ( e.closest('.woocommerce-product-gallery').length ) {
					e = e.closest('.woocommerce-product-gallery');
				}

				return e;

			},

			setBoxLayout: function( box, relative ) {

				var e = $(this);

				var offset = e.offset();
				var parentOffset = $('body').offset();
				var parentPosition = $('body').css('position');

				if ( relative ) {
					parentPosition = 'none';
					offset = e.position();
				}

				if ( offset && parentOffset  ) {

					var top = 0;
					var left = 0;

					if ( parentPosition === 'relative' ) {
						top = offset.top - parentOffset.top + parseInt( e.css('padding-top') );
						left = offset.left - parentOffset.left + parseInt( e.css('padding-left') );
					} else {
						top = offset.top + parseInt( e.css('padding-top') );
						left = offset.left + parseInt( e.css('padding-left') );
					}

					if ( parentPosition === 'none' ) {
						top = top + parseInt( e.css('margin-top') );
						left = left + parseInt( e.css('margin-left') );
					}

					var styles = {
						top : top,
						left: left
					};

					if ( opts.zIndex && opts.zIndex !== '9999999999999999' && ! methods.isMobile() && opts.position === 'image_hover' ) {
						styles.zIndex = opts.zIndex;
					}

					styles = StiHooks.apply_filters( 'sti_sharing_box_layout', styles, { box: box, el: e, opts: opts } );

					$( box ).css(styles);

				}

			},

			hideShare: function() {
				$('#'+stiBoxSingleSelector).hide();
			},

			closeMobileButtons: function() {
				$('.sti-mobile-btn').removeClass('sti-mobile-show');
			},

            replaceVariables: function( data, sstring ) {
                return sstring.replace('{{image_link}}', data.media)
                      .replace('{{page_link}}', data.link)
                      .replace('{{title}}', data.title)
                      .replace('{{summary}}', data.summary);
            },

			windowSize: function( network ) {
			
				switch( network ) { 			
					case "facebook" : return "width=670,height=320";
					break;

					case "messenger" : return "width=900,height=500";
					break;
					
					case "twitter" : return "width=626,height=252";
					break;

					case "linkedin" : return "width=620,height=450";
					break;

					default: return "width=800,height=350";
					
				}	
				
			},
			
			replaceChars: function(string) {
				var str = string;
				if ( str && str !== '' ) {
					var specialCharsRegex = /[`~!@#$%^&*()_|+\-=?;:'",’<>\{\}\[\]\\\/]/gi;
					specialCharsRegex = StiHooks.apply_filters( 'sti_chars_remove_regex', specialCharsRegex, { str: str } );
					str = string.replace( specialCharsRegex, '' );
				}
				return str;
			},

            getBgImageURL: function(e) {

                var insideE = undefined;

                if ( e.css('background-image') && e.css('background-image') !== 'none' ) {
                    insideE = e.css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "");
                }

                return insideE;

            },

			fillFullPath: function( url ) {

				if ( url.indexOf( window.location.host ) == -1 && url.indexOf( 'http' ) != 0 && url.indexOf( 'www' ) != 0 ) {
					var root = window.location.href;
					if ( url.charAt(0) === '/' ) {
						root = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
					}
					url = root + url
				}

				return url;

			},

			checkForImgFullSize: function( url ) {
				var matches = url.match(/(-\d+?x\d+?)\.(png|jpg|jpeg|gif|svg)/);
				if ( matches ) {
					url = url.replace( matches[1], '' );
				}
				return url;
			},

			shareData: function(el, network) {

				var data    = {},
					e       =  currentImage ? $(currentImage) : ( currentImageElements && $(el).closest('.sti-top').data('el') ? currentImageElements[$(el).closest('.sti-top').data('el')] : ( $(el).closest('.sti-container') ? $(el).closest('.sti-container') : false ) ),
					caption = false,
                    captionText = false;

				e = StiHooks.apply_filters( 'sti_element', e );
				
				data.w_size = methods.windowSize( network );
				data.media  = e.data('media') ? e.data('media') : ( e[0].src ? e[0].src : methods.getBgImageURL(e) );

                if ( typeof data.media === 'undefined' ) {

                    var insideE = methods.findMediaElement(e);

                    if ( insideE ) {
                        data.media = insideE.data('media') ? insideE.data('media') : ( insideE[0].src ? insideE[0].src : methods.getBgImageURL(insideE) );
                        e = insideE;
                    }

                }

                if ( data.media ) {
					data.media = methods.fillFullPath( data.media );
					data.media = methods.checkForImgFullSize( data.media );
				}

				data.media = StiHooks.apply_filters( 'sti_media', data.media, e, network );

				caption = e.closest('.wp-caption');
				if ( caption.length ) {
					captionText = caption.find('.wp-caption-text').text();
				}

				data.e        =  e;
				data.hash     =  methods.getUrlHash( data );
				data.network  = network;
                data.title    =  e.data('title') ? e.data('title') : ( e.attr('title') ? e.attr('title') : ( opts.title ? opts.title : document.title ) );
                data.summary  =  e.data('summary') ? e.data('summary') : ( captionText ? captionText : ( e.attr('alt') ? e.attr('alt') : ( opts.summary ? opts.summary : '' ) ) );
				data.message  =  data.network === 'twitter' ? data.title : data.title + ' ' + data.media;
				data.local    =  location.href.replace(/\?img.*$/, '').replace(/\&img.*$/, '').replace(/#.*$/, '').replace(/[\?|&]scroll.*$/, '');
				data.schar    =  ( data.local.indexOf("?") != -1 ) ? '&' : '?';
				data.ssl      =  data.media.indexOf('https://') >= 0 ? '&ssl=true' : '';
				data.link     =  e.data('url') ? e.data('url') : ( ( data.local.indexOf("?") != -1 ) ? data.local + data.hash : data.local + data.hash.replace(/&/, '?') );
				data.locUrl   =  e.data('url') ? '&url=' + encodeURIComponent( e.data('url') ) : '';
				data.page     =  opts.sharer ? opts.sharer + '?url=' + encodeURIComponent(data.link) + '&img=' + encodeURIComponent( data.media.replace(/^(http?|https):\/\//,'') ) + '&title=' + encodeURIComponent(methods.replaceChars(data.title)) + '&desc=' + encodeURIComponent(methods.replaceChars(data.summary)) + '&network=' + network + data.ssl + data.hash :
											   data.local + data.schar + 'img=' + encodeURIComponent( data.media.replace(/^(http?|https):\/\//,'') ) + '&title=' + encodeURIComponent(methods.replaceChars(data.title)) + '&desc=' + encodeURIComponent(methods.replaceChars(data.summary)) + '&network=' + network + data.locUrl + data.ssl + data.hash;

				// links shortener
				data = methods.setShortLinks( data );

				data = StiHooks.apply_filters( 'sti_data', data );

				return data;

			},

			getUrlHash: function( data ) {
				if ( $(data.e).closest('.et_pb_gallery_item').length > 0 || $(data.e).closest('.mfp-container').length > 0 ) {
					return '&scroll=' + methods.createHash( data.media, 5 );
				}
				return '';
			},

			findMediaElement: function(e) {

                var insideE = false;

                if ( e.find('.coin-slider').length && e.find('.coin-slider .cs-title + a').length && e.find('.coin-slider .cs-title + a').css('background-image') ) {
                    insideE = e.find('.coin-slider .cs-title + a');
                }
                else if ( e.find('img.nivo-main-image').length ) {
                    insideE = e.find('img.nivo-main-image');
                }
                else if ( e.find('[data-media]').length ) {
                    insideE = e.find('[data-media]');
                }
                else if ( e.find('img').length ) {
                    insideE = e.find('img');
                }
				else if ( e.find('.e-gallery-image').length ) {
					insideE = e.find('.e-gallery-image');
				}

                return insideE;

            },

			share: function(network, data) {	
				
				var url = '';
					
				switch( network ) {
				
					case "facebook" :
                        url += 'http://www.facebook.com/sharer.php?u=';
                        url += encodeURIComponent(data.page);
					break;

					case "messenger" :
						if ( !methods.isMobile() ) {
							url += 'http://www.facebook.com/dialog/send?';
							url += 'link=' + encodeURIComponent(data.page);
							url += '&redirect_uri=' + encodeURIComponent(data.local+data.schar+'close=1');
						} else {
							url += 'fb-messenger://share/?';
							url += 'link=' + encodeURIComponent(data.page);
						}
						if ( opts.appId ) {
							url += '&app_id=' + encodeURIComponent( opts.appId );
						}
					break;

					case "linkedin" :
						url += 'http://www.linkedin.com/shareArticle?mini=true';
						url += '&url=' + encodeURIComponent(data.page);
					break;		
					
					case "vkontakte" :
						url += 'http://vk.com/share.php?';
						url += 'url=' + encodeURIComponent(data.link);
						url += '&title=' + encodeURIComponent(data.title);
						url += '&description=' + encodeURIComponent(data.summary);
						url += '&image=' + encodeURIComponent(data.media);
						url += '&noparse=true';
					break;

					case "odnoklassniki" :
						url += 'https://connect.ok.ru/offer';
						url += '?url=' + encodeURIComponent(data.page);
						url += '&title=' + encodeURIComponent(data.title);
						url += '&imageUrl=' + encodeURIComponent(data.media);
					break;
					
					case "twitter" :
						url += 'https://twitter.com/intent/tweet?';
						url += 'text=' + encodeURIComponent( data.message );
						url += '&url=' + encodeURIComponent(data.page);
						if (opts.twitterVia) {
						url += '&via=' + opts.twitterVia;
						}
					break;

					case "whatsapp" :
						url += 'https://api.whatsapp.com/send?';
						url += 'text=' + encodeURIComponent( data.message );
					break;

					case "viber" :
						url += 'viber://forward?';
						url += 'text=' + encodeURIComponent( data.message );
					break;

					case "telegram" :
						url += 'https://telegram.me/share/url';
						url += '?url=' + encodeURIComponent(data.link);
						url += '&text=' + encodeURIComponent(data.message );
					break;

					case "pinterest" :
						url += 'http://pinterest.com/pin/create/button/?';
						url += 'url=' + encodeURIComponent(data.page);
					break;

					case "tumblr" :
						url += 'http://tumblr.com/widgets/share/tool?';
						url += 'shareSource=legacy';
						url += '&posttype=photo';
						url += '&canonicalUrl=' + encodeURIComponent(data.page);
						url += '&title=' + encodeURIComponent(data.title);
						url += '&caption=' + encodeURIComponent(data.summary);
						url += '&content=' + encodeURIComponent(data.media);
						url += '&url=' + encodeURIComponent(data.media);
					break;

					case "reddit" :
						url += 'http://reddit.com/submit?';
						url += 'url=' + encodeURIComponent(data.link);
						url += '&title=' + encodeURIComponent(data.title);
						url += '&text=' + encodeURIComponent(data.summary);
					break;
					
				}

				if ( opts.custom_data && opts.custom_data.buttons && opts.custom_data.buttons[network] ) {
					url += opts.custom_data.buttons[network]['link'];
					url = methods.replaceVariables( data, url );
					if ( opts.custom_data.buttons[network]['blank'] ) {
						window.open( url, '_blank' );
						return;
					}
				}

				url = StiHooks.apply_filters( 'sti_sharing_url', url, { data: data } );

				methods.openPopup(url, data);
				
			},

			openPopup: function(url, data) {
				var win = window.open( url, 'Share This Image', data.w_size + ',status=0,toolbar=0,menubar=0,scrollbars=1' );
				var timer = setInterval( function() {
					if( win.closed ) {
						clearInterval( timer );
						methods.createAndDispatchEvent( document, 'stiSharingWindowClosed', { url: url, data: data } );
					}
				}, 1000);
			},
			
			analytics: function( category, label ) {

				methods.createAndDispatchEvent( document, 'stiAnalytics', { button: category, image: label } );

				if ( opts.analytics ) {
					try {

						var tagF = false;
						if ( typeof gtag !== 'undefined' && gtag !== null ) {
							tagF = gtag;
						} else if ( typeof window.dataLayer !== 'undefined' && window.dataLayer !== null ) {
							tagF = function () { window.dataLayer.push(arguments) };
						}

						if ( tagF ) {

							tagF('event', 'STI click', {
								'event_label': label,
								'event_category': category,
								'transport_type' : 'beacon'
							});

							tagF('event', 'sti_share', {
								'sti_button': category,
								'sti_image': label,
							});

						}

						if ( typeof ga !== 'undefined' && ga !== null ) {
							ga('send', 'event', 'STI click', category, label);
						}
						if ( typeof _gaq !== 'undefined' && _gaq !== null ) {
							_gaq.push(['_trackEvent', 'STI click', category, label ]);
						}
						if ( typeof pageTracker !== "undefined" && pageTracker !== null ) {
							pageTracker._trackEvent( 'STI click', category, label )
						}
						// This uses Monster Insights method of tracking Google Analytics.
						if ( typeof __gaTracker !== 'undefined' && __gaTracker !== null ) {
							__gaTracker( 'send', 'event', 'STI click', category, label );
						}

					}
					catch (error) {
					}
				}
			},

			createCustomEvent: function( event, params ) {

				var customEvent = false;
				params = params || null;

				if ( typeof window.CustomEvent === "function" ) {
					customEvent = new CustomEvent( event, { bubbles: true, cancelable: true, detail: params } );

				}
				else if ( document.createEvent ) {
					customEvent = document.createEvent( 'CustomEvent' );
					customEvent.initCustomEvent( event, true, true, params );
				}

				return customEvent;

			},

			createAndDispatchEvent: function( obj, event, params ) {

				var customEvent = methods.createCustomEvent( event, params );

				if ( customEvent ) {
					obj.dispatchEvent( customEvent );
				}

			},

			relayoutButtons: function() {
				if ( opts.position === 'image' || ( opts.position === 'image_hover' && methods.isMobile() ) ) {
					$('.sti-top').each(function() {
						var el = $(this).prev();
						var elId = $(this).attr('id');
						methods.setBoxLayout.call(el, '#' + elId, true);
					});
				}
			},

			isMobile: function() {
				var check = false;
				(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
				return check;
			},

			getUrlParams: function() {

				var urlParams = {};
				var match,
					pl = /\+/g,  // Regex for replacing addition symbol with a space
					search = /([^&=]+)=?([^&]*)/g,
					decode = function (s) {
						return decodeURIComponent(s.replace(pl, " "));
					},
					query = window.location.search.substring(1);

				while (match = search.exec(query)) {
					urlParams[decode(match[1])] = decode(match[2]);
				}

				return urlParams;

			},

			setShortLinks: function( data ) {

				var allowedNetworks = new Array( "twitter", "messenger", "whatsapp", "viber", "telegram" );

				if ( ( opts.short_url === 'sti' || opts.short_url === 'true' ) && allowedNetworks.indexOf( data.network ) != -1 ) {

					var hash = methods.createHash( data.page, 7 );
					if ( hash ) {
						methods.ajaxSaveShortLink( hash, data.page, true );
						data.page = opts.url_structure ? opts.homeurl + 'sti/' + hash : opts.homeurl + '?sti=' + hash;
					}

				}

				return data;

			},

			ajaxSaveShortLink: function( hash, link, async ) {

				$.ajax({
					type: 'POST',
					url: opts.ajaxurl,
					dataType: "json",
					async: async,
					data: {
						action: 'sti_shortLinks',
						hash : hash,
						link: link
					},
					success: function( response ) {
					},
					error: function (jqXHR, textStatus, errorThrown) {
					}
				})

			}

		};

		methods.createAndDispatchEvent( document, 'stiLoaded');

		if ( options === 'relayout' ) {
			methods.relayoutButtons();
		}

		stiBoxSingleSelector = 'sti-box-s-' + methods.stringToId(opts.selector);

		if ( !methods.isMobile() ) {

			if ( opts.position !== 'image_hover' ) {
				var i = 0;
				this.each(function() {

					var el = methods.detectRightContainer(this);

					if ( el && ! el.next().hasClass('sti') ) {

						do {
							i++
						} while( $('#sti-box-'+i).length > 0 );

						currentImageElements[i] = el;

						el.after('<div data-el="'+i+'" id="sti-box-'+i+'" class="sti sti-top style-flat-small sti-inside" style="display: none;"><div class="sti-share-box">' + methods.shareButtons() + '</div></div>');
						methods.showShare(el, '#sti-box-' + i, true);

					}

				});
			
			} else {

				if ( ! $('#'+stiBoxSingleSelector).length ) {
					$(appendButtonsTo).append('<div id="'+stiBoxSingleSelector+'" class="sti sti-top sti-hover style-flat-small" style="display: none;"><div class="sti-share-box">' + methods.shareButtons() + '</div></div>');
				}

				$(document).on('mouseenter', opts.selector, function(e) {
					e.preventDefault();
					var el = methods.detectRightContainer(this);
					if ( $('.sti-hover:visible').length === 0 ) {
						methods.showShare(el, '#'+stiBoxSingleSelector);
					}
					currentImage = this;
				});
					
				$(document).on('mouseleave', opts.selector, function(e) {
					e.preventDefault();
					var target = e.relatedTarget || e.toElement;
					if ( ! $(target).closest('.sti').length ) {
						methods.hideShare();
					}
				});

				$(document).on('mouseleave', '.sti', function(e) {
					e.preventDefault();
					var target = e.relatedTarget || e.toElement;
					if ( !( currentImage && target == currentImage ) ) {
						methods.hideShare();
					}
				});

			}
		
		} else {

			if ( ! $('#'+stiBoxSingleSelector).length ) {
				$(appendButtonsTo).append('<div id="'+stiBoxSingleSelector+'" class="sti sti-top sti-mobile style-flat-small" style="display: none;"><div class="sti-share-box">' + methods.shareButtons() + '</div></div>');
			}

			var i = 0;

			this.each(function() {

				var el = methods.detectRightContainer(this);

				if ( el && ! el.next().hasClass('sti-mobile-btn') ) {

					do {
						i++
					} while( $('#sti-mobile-btn-'+i).length > 0 );

					currentImageElements[i] = el;

					el.after('<div data-el="'+i+'" data-box="'+stiBoxSingleSelector+'" id="sti-mobile-btn-'+i+'" class="sti-top sti-mobile-btn" style="display: none;">' + methods.getSvgIcon( 'mobile' ) + '</div>');
					methods.showShare(el, '#sti-mobile-btn-' + i, true);

				}

			});

			$('.sti-mobile-btn').on('click touchend', function(e) {
				e.preventDefault();
				currentImage = $(this).prev();
				//methods.hideShare();
				$('.sti-mobile').hide();
				var stiBox = $(this).data('box');
				if ( $('.sti-mobile:visible').length === 0 ) {
					methods.showShare(currentImage, '#'+stiBox);
					methods.closeMobileButtons();
					$(this).addClass('sti-mobile-show');
				}
			});

			$(opts.selector).on('click touchend', function(e) {
				//methods.hideShare();
				$('.sti-mobile').hide();
				methods.closeMobileButtons();
			});
		
		}


		// STI sharing buttons initialized
		methods.createAndDispatchEvent( document, 'stiInit');


		$('.sti-btn, a[href^="#sti-"]').on('click touchend', function(e) {
			e.preventDefault();
            e.stopPropagation();
			e.stopImmediatePropagation();

			var network = $(this).data('network');

			network = StiHooks.apply_filters( 'sti_network', network, { el: this } );

			var data = methods.shareData(this, network);

            methods.share(network, data);

			methods.analytics( network, data.media );

			methods.createAndDispatchEvent( this, 'stiButtonClick', { button: network, data: data } );

        });

		$( window ).resize(function() {
			methods.relayoutButtons();
		});

		$( window ).scroll(function() {
			if ( opts.position === 'image_hover' && ! methods.isMobile() && $('#'+stiBoxSingleSelector).is(':visible') ) {
				var el = methods.detectRightContainer( currentImage );
				methods.showShare(el, '#'+stiBoxSingleSelector);
			}
		});

		methods.scrollToImage(this);

	};

    // Call plugin method
	$(window).on('load', function() {
        $(selector).sti();
    });


    // Support for third party plugins
    $(document).on('shown.simplelightbox doLightboxViewImage modula_lightbox2_lightbox_open theiaPostSlider.changeSlide, envirabox-change, elementor/popup/show', function() {
		setTimeout(function() {
			$(selector).sti();
		}, 500);
    });


	$(window).on('load', function() {

		var $imageLinks = $('a img, a.popup-image');
		var element = false;
		var lightboxesSelector = '.nivo-lightbox-image:visible, .slb_content:visible, .mfp-img:visible, #envirabox-img:visible';
		var watchToElements = '.wp-block-jetpack-slideshow, .jp-carousel-wrap, .wp-block-envira-envira-gallery, .slb_viewer, .sl-wrapper.simple-lightbox, .elementor-lightbox .dialog-lightbox-message';

		if ( sti_vars.position === 'image' ) {

			$imageLinks.on('click', function() {
				element = false;
				var currentImg = this;
				setTimeout(function() {
					var $lightboxes = $(lightboxesSelector);
					if ( $lightboxes.length > 0 ) {
						$(selector).sti();
						if ( typeof StiHooks === 'object' && typeof StiHooks.add_filter === 'function' ) {
							element = $(currentImg);
							StiHooks.add_filter( 'sti_element', sti_element );
						}
					}
				}, 1000);
			});

			var timeoutID;
			$('body').on('DOMSubtreeModified', watchToElements, function() {
				window.clearTimeout(timeoutID);
				timeoutID = window.setTimeout( function() {
					$(selector).sti();
				}, 1000 );
			});

		}

		// Lazy load support
		var lazyTimeoutID;
		$('img').on('load', function(){
			window.clearTimeout(lazyTimeoutID);
			lazyTimeoutID = window.setTimeout( function() {
				$(selector).sti('relayout');
			}, 100 );
		});

		function sti_element( value ) {
			var $lightboxes = $(lightboxesSelector);
			if ( element && $lightboxes.length > 0 ) {
				return element;
			}
			return value;
		}

		// Support for Ajax Load More Plugin
		window.almComplete = function(alm){
			setTimeout(function() {
				$(selector).sti();
			}, 200);
		};

	});

})( jQuery );