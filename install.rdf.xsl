<!--  remove hidden et updateURL tags -->

<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns:em="http://www.mozilla.org/2004/em-rdf#">

 <xsl:output indent="yes" standalone="no"/>

    <xsl:template match="node()|@*">
      <xsl:copy>
         <xsl:apply-templates select="node()|@*"/>
      </xsl:copy>
    </xsl:template>

    <xsl:template match="em:hidden"/>
    <xsl:template match="em:updateURL"/>
</xsl:stylesheet>
