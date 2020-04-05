"use strict";

$(function() {
    $( "#payment-form" ).on( "submit", function( e ) {
        e.preventDefault();

        $( ".text-danger" ).remove();
        $( "#status" ).hide().removeClass( "alert-danger alert-success" );

        var data = {
            cc: $( "#cc" ).val(),
            cvv: $( "#cvv" ).val(),
            expire: $( "#expire" ).val(),
            amount: ( $( "#amount" ).val().length > 0 && /^\d+$/.test( $( "#amount" ).val() ) ) ? $( "#amount" ).val() + ".00" : $( "#amount" ).val()
        };

        $.post( "/checkout", data, function( res ) {
            if( res.errors ) {
                res.errors.forEach(function( err ) {
                    $( "#" + err.param ).after( '<p class="text-danger">' + err.msg + '</p>' );
                });
            } else if( res.error ) {
                $( "#status" ).text( res.error ).addClass( "alert-danger" ).show();
            } else if( res.success ) {
                $( "#status" ).text( res.success ).addClass( "alert-success" ).show(); 
            }
        });
    });
});