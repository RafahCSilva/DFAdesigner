function DFAmsg ( local ) {
  this.localmsg  = document.getElementById( local );
  this.mensagens = [];
  this.erros     = false;

  this.localmsg.className = 'hidden';

  this.addMsgErro = function ( text ) {
    this.erros = true;
    this.mensagens.push( '[ ERRO ] ' + text );
  };

  this.addMsgAlerta = function ( text ) {
    this.mensagens.push( '[ALERTA] ' + text );
  };

  this.haErros = function () {
    return this.erros;
  };

  this.exibir = function () {
    if ( this.mensagens.length > 0 ) {
      var t = 'Erros Encontrados: <br>\n';
      t += '<ul>\n';
      for ( var m in this.mensagens ) {
        t += '\t<li>' + this.mensagens[ m ].toString() + '</li>\n';
      }
      t += '</ul>\n';
      this.localmsg.className = 'mostrar';
      this.localmsg.innerHTML = t;
    }
  }
}


// Acao SALVAR RESCUNHO
// salva somente o designer do DFA
function DFA_SAVE () {
  if ( !JSON ) {
    console.log( "Seu navegador não é suportado." );
    return;
  }

  var tuplaDesigner = {
    'nodes': [],
    'links': []
  };
  var i;
  // NODEs
  for ( i in nodes ) {
    // um NODE dos NODES
    var node         = nodes[ i ];
    var designerNode = {
      'x'            : node.x,
      'y'            : node.y,
      'text'         : node.text,
      'isAcceptState': node.isAcceptState
    };
    tuplaDesigner.nodes.push( designerNode );
  }

  // LINKs
  for ( i in links ) { // Uma transicao dos links
    var link = links[ i ];

    var designerLink = null;
    if ( link instanceof SelfLink ) { // transicao para ele msm
      designerLink = {
        'type'       : 'SelfLink',
        'node'       : nodes.indexOf( link.node ),
        'text'       : link.text,
        'anchorAngle': link.anchorAngle
      };
    } else if ( link instanceof StartLink ) { // transicao inicial
      designerLink = {
        'type'  : 'StartLink',
        'node'  : nodes.indexOf( link.node ),
        'text'  : link.text,
        'deltaX': link.deltaX,
        'deltaY': link.deltaY
      };
    } else if ( link instanceof Link ) { // transicao de nodeA para nodeB
      designerLink = {
        'type'             : 'Link',
        'nodeA'            : nodes.indexOf( link.nodeA ),
        'nodeB'            : nodes.indexOf( link.nodeB ),
        'text'             : link.text,
        'lineAngleAdjust'  : link.lineAngleAdjust,
        'parallelPart'     : link.parallelPart,
        'perpendicularPart': link.perpendicularPart
      };
    }
    if ( designerLink != null ) {
      tuplaDesigner.links.push( designerLink );
    }
  }

  // Designer do DFA
  document.getElementById( "DFAdesign" ).value = JSON.stringify( tuplaDesigner );

  // Dados do DFA
  document.getElementById( "DFAdados" ).value = "";

  // Tipo de submissao
  document.getElementById( "tipoDeSubmissao" ).value = "salvar";

  // Mostra no campo <pre>
  document.getElementById( "DFAdesign_pre" ).innerHTML = JSON.stringify( tuplaDesigner );
  document.getElementById( "DFAdados_pre" ).innerHTML  = "";
  document.getElementById( "erros" ).className         = 'hidden';

  return true;
}


// Acao SUBMETER
function DFA_SUBMIT () {
  var erros = new DFAmsg( 'erros' );

  if ( !JSON ) {
    console.log( "!JSON" );
    erros.addMsgErro( 'Seu navegador não é suportado.' );
    erros.exibir();
    return false;
  }

  var i, j;

  try {
    // JSON do Designer
    var tuplaDesigner = {
      'nodes': [],
      'links': []
    };

    // 5-TUPLA dados
    var Q        = [];                        // conjunto de nós, guardará o nome do node em cada indice
    var alfabeto = getAlfabeto();             // alfabeto ( é definido na questão )
    var delta    = new Array( nodes.length ); // delta eé a matriz 2D de transicao com #nodes * #alfabeto valores
    for ( i in nodes ) {
      delta[ i ] = new Array( alfabeto.length );
    }
    var q0 = [];   // conj q0 é o nó inicial
    var F  = [];   // conjunto de nós de aceitação

    // inicializar delta com -1 (onde tiver -1 não tem transição)
    for ( i in nodes ) {
      for ( j in alfabeto ) {
        delta[ i ][ j ] = -1;
      }
    }

    // 5-TUPLA STDIN
    var STDIN = "";

    //if ( nodes.length == 0 ) {
    //  erros.addMsgErro( 'Não há estados em seu autômato.' );
    //}
    // NODEs
    STDIN += nodes.length; // numero de NODES
    for ( i in nodes ) { // cada NODE dos NODES
      var node = nodes[ i ];

      // verifica se o nome do estado não está vazio
      if ( node.text == "" ) {
        erros.addMsgAlerta( 'Estado não nomeado, renomeando para \'' + i + '\'.' );
        node.text = i;  // renomeia o estado
      }
      // designer
      var designerNode = {
        'x'            : node.x,
        'y'            : node.y,
        'text'         : node.text,
        'isAcceptState': node.isAcceptState
      };
      tuplaDesigner.nodes.push( designerNode );

      Q.push( node.text ); // add o node ao conj Q
      if ( node.isAcceptState ) {
        F.push( i ); // se ele for final, add o index do node ao conj F
      }

    }
    STDIN += " ";

    // verif se |Q| == 0
    if ( Q.length == 0 ) {
      erros.addMsgErro( 'Não há estados em seu autômato.' );
    }


    // lINKs
    for ( i in links ) { // Cada transicao dos LINKS
      var link = links[ i ];

      var designerLink = null;
      var alfid;

      if ( link instanceof SelfLink ) { // transicao para ele mesmo
        designerLink = {
          'type'       : 'SelfLink',
          'node'       : nodes.indexOf( link.node ),
          'text'       : link.text,
          'anchorAngle': link.anchorAngle
        };
        if ( link.text == '' ) {
          erros.addMsgErro( 'A transição do estado \'' + link.node.text + '\' para o estado \'' +
              link.node.text + '\', não tem um simbolo associado.' );
        } else {
          var t = link.text.toString();
          var j = 0;
          while ( (j = t.indexOf( ' ', j )) != -1 ) {
            t = t.replace( ' ', '' );
          }
          var simbolos = t.split( "," );

          for ( i in simbolos ) {
            if ( simbolos[ i ].toString() == '' ) {
              continue;
            }
            alfid = alfabeto.indexOf( simbolos[ i ].toString() );
            if ( alfid == -1 ) {
              erros.addMsgErro( 'Há uma transição de um simbolo não contido no alfabeto do estado \'' +
                  link.node.text + '\' para o estado \'' + link.node.text + '\' com o simbolo \'' + simbolos[ i ] + '\'.' );
            } else if ( delta[ nodes.indexOf( link.node ) ][ alfid ] != -1 ) {
              erros.addMsgErro( 'A transição do estado \'' + link.node.text + '\' para o estado \'' +
                  link.node.text + '\' com o simbolo \'' + simbolos[ i ] + '\' está sobrescrevendo um outra transição.' );
              //return false;
            } else {
              delta[ nodes.indexOf( link.node ) ][ alfid ] = nodes.indexOf( link.node );
            }
          }
        }

      } else if ( link instanceof StartLink ) { // transicao inicial
        designerLink = {
          'type'  : 'StartLink',
          'node'  : nodes.indexOf( link.node ),
          'text'  : link.text,
          'deltaX': link.deltaX,
          'deltaY': link.deltaY
        };
        q0.push( nodes.indexOf( link.node ) ); // coloca o node no q0

      } else if ( link instanceof Link ) { // transicao de nodeA para nodeB
        designerLink = {
          'type'             : 'Link',
          'nodeA'            : nodes.indexOf( link.nodeA ),
          'nodeB'            : nodes.indexOf( link.nodeB ),
          'text'             : link.text,
          'lineAngleAdjust'  : link.lineAngleAdjust,
          'parallelPart'     : link.parallelPart,
          'perpendicularPart': link.perpendicularPart
        };
        if ( link.text == '' ) {
          erros.addMsgErro( 'A transição do estado \'' + link.nodeA.text + '\' para o estado \'' +
              link.nodeB.text + '\', não tem um simbolo associado.' );
        } else {
          var t = link.text.toString();
          var j = 0;
          while ( (j = t.indexOf( ' ', j )) != -1 ) {
            t = t.replace( ' ', '' );
          }
          var simbolos = t.split( "," );

          for ( i in simbolos ) {
            if ( simbolos[ i ].toString() == '' ) {
              continue;
            }
            alfid = alfabeto.indexOf( simbolos[ i ].toString() );
            if ( alfid == -1 ) {
              erros.addMsgErro( 'Há uma transição de um simbolo não contido no alfabeto do estado \'' +
                  link.nodeA.text + '\' para o estado \'' + link.nodeB.text + '\' com o simbolo \'' + simbolos[ i ] + '\'.' );
            } else if ( delta[ nodes.indexOf( link.nodeA ) ][ alfid ] != -1 ) {
              erros.addMsgErro( 'A transição do estado \'' + link.nodeA.text + '\' para o estado \'' +
                  link.nodeB.text + '\' com o simbolo \'' + simbolos[ i ] + '\' está sobrescrevendo um outra transição.' );
            } else {
              delta[ nodes.indexOf( link.nodeA ) ][ alfid ] = nodes.indexOf( link.nodeB );
            }
          }

        }

      }

      if ( designerLink != null ) {
        tuplaDesigner.links.push( designerLink );
      }
    }

    //# Confere se ha todas as transicoes (nao ha -1)
    for ( i in Q ) {
      for ( j in alfabeto ) {
        if ( delta[ i ][ j ] == -1 ) {
          erros.addMsgErro( 'Não há transição com o simbolo \'' + alfabeto[ j ] + '\' do estado \'' + Q[ i ] + '\'.' );
        }
      }
    }

    // delta
    for ( i in Q ) {
      for ( j in alfabeto ) {
        STDIN += delta[ i ][ j ] + " ";
      }
    }

    // q0
    if ( Q.length > 0 && q0.length == 0 ) {  // verif se q0 esta vazio
      erros.addMsgErro( 'Não há transição inicial para indicar em seu autômato qual é o estado inicial.' );
    } else if ( q0.length > 1 ) { // verif se há mais de um estado inicial
      erros.addMsgErro( 'Há mais de um estado inicial em seu autômato.' );
    } else {
      STDIN += q0[ 0 ] + " ";
    }

    // F
    if ( Q.length > 0 && F.length < 1 ) {// verif se |F| < 1
      erros.addMsgAlerta( 'Não há estado de aceitação em seu autômato.' );
    }
    STDIN += F.length;
    for ( i in F ) {
      STDIN += " " + F[ i ];
    }

  } catch ( e ) {
    //console.log( "DFA_SUBMIT() ERROR: \n\t" + e.message );
    erros.addMsgErro( 'Falha na Submissão: ' + e.message );
  }

  erros.exibir();

  if ( erros.haErros() ) {
    /// Mostra no campo <pre>
    document.getElementById( "DFAdesign_pre" ).innerHTML = "";
    document.getElementById( "DFAdados_pre" ).innerHTML  = "";
    return false;

  } else {
    // Designer do DFA
    document.getElementById( "DFAdesign" ).value       = JSON.stringify( tuplaDesigner );
    // Dados do DFA
    document.getElementById( "DFAdados" ).value        = STDIN;
    // Tipo de submissao
    document.getElementById( "tipoDeSubmissao" ).value = "submeter";

    // Mostra no campo <pre>
    document.getElementById( "DFAdesign_pre" ).innerHTML = JSON.stringify( tuplaDesigner );
    document.getElementById( "DFAdados_pre" ).innerHTML  = STDIN;

    return true;
  }
}

// Restaurar o DFA salvo
// get o value do input hidden 'DFAdesign' q sera o JSON do DFA
function DFA_LOAD () {
  try {
    var DFAdesign = document.getElementById( "DFAdesign" ).value;
  } catch ( e ) {
    throw new Error( "ERRO DFA_LOAD > DFAdesign: " + e );
  }
  if ( (DFAdesign == "") || !JSON ) {
    return;
  }
  var i;
  try {
    var backup = JSON.parse( DFAdesign );

    for ( i in backup.nodes ) {
      var backupNode     = backup.nodes[ i ];
      var node           = new Node( backupNode.x, backupNode.y );
      node.isAcceptState = backupNode.isAcceptState;
      node.text          = backupNode.text;
      nodes.push( node );
    }
    for ( i in backup.links ) {
      var backupLink = backup.links[ i ];
      var link       = null;
      if ( backupLink.type == 'SelfLink' ) {
        link             = new SelfLink( nodes[ backupLink.node ] );
        link.anchorAngle = backupLink.anchorAngle;
        link.text        = backupLink.text;
      } else if ( backupLink.type == 'StartLink' ) {
        link        = new StartLink( nodes[ backupLink.node ] );
        link.deltaX = backupLink.deltaX;
        link.deltaY = backupLink.deltaY;
        link.text   = backupLink.text;
      } else if ( backupLink.type == 'Link' ) {
        link                   = new Link( nodes[ backupLink.nodeA ], nodes[ backupLink.nodeB ] );
        link.parallelPart      = backupLink.parallelPart;
        link.perpendicularPart = backupLink.perpendicularPart;
        link.text              = backupLink.text;
        link.lineAngleAdjust   = backupLink.lineAngleAdjust;
      }
      if ( link != null ) {
        links.push( link );
      }
    }
  } catch ( e ) {
    console.log( "Erro no DFA_LOAD(): \n\t" + e.message );
    nodes = null;
    links = null;
    throw new Error( "Erro no DFA_LOAD(): \n\t" + e.message );
  }
}

// get o alfabeto entrado no "txt_alfabeto" e o transf em array
function getAlfabeto () {
  var txtAlf   = document.getElementById( "txt_alfabeto" );
  var txt      = StringFulltrim( txtAlf.value.toString() );
  txtAlf.value = txt;  // atualiza txt_alfabeto
  return txt.split( " " );
}

function StringFulltrim ( inputText ) {
  return inputText.replace( /(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '' ).replace( /\s+/g, ' ' );
}

function printAlfabeto () {
  var arr = getAlfabeto();
  var txt = "<b>&Sigma;</b> = {";
  for ( var a in arr ) {
    txt += " <b>" + arr[ a ] + "</b>";
    if ( a < arr.length - 1 ) {
      txt += ",";
    }
  }
  txt += " }";
  document.getElementById( "sigma" ).innerHTML = txt; // exibe o conjunto Sigma
}