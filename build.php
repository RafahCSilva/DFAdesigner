<?php
$files = array( 'src/_license.js',
                'src/DFA/DFAheader.js',

                'src/elements/node.js',
                'src/elements/link.js',
                'src/elements/self_link.js',
                'src/elements/start_link.js',
                'src/elements/temporary_link.js',

                'src/main/fsm.js',
                'src/main/math.js',

                'src/DFA/DFAsupport.js', );
$out   = fopen( "DFAdesigner.js", "w" );

echo "joining files:  <br>\n";
foreach ( $files as $file ) {
  echo "\t" . $file;
  $in = fopen( $file, "r" );
  while ( $line = fread( $in, filesize( $file ) ) ) {
    fwrite( $out, $line );
  }
  fclose( $in );
  echo "......... OK <br>\n";
}
echo "<br>\n successfully joined file";
fclose( $out );
